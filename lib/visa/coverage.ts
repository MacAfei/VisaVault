import {
  isBefore,
  isAfter,
  isSameOrBefore,
  isSameOrAfter,
  daysBetween,
  addMonthsString,
  getTodayString,
} from '../clock';
import { calculateEntries } from './entries';
import { calculateStay } from './stayCounter';
import { checkPassportLinkage } from './linkage';

export type ReasonSeverity = 'BLOCKER' | 'WARNING' | 'INFO';

export interface CoverageReason {
  severity: ReasonSeverity;
  ruleId: string;
  message: string;
  fix: string;
}

export interface CoverageEvaluation {
  verdict: 'COVERED' | 'PARTIAL' | 'NOT_COVERED';
  matchedVisa?: any;
  reasons: CoverageReason[];
  details: {
    entriesRemaining: number;
    daysRemainingInWindow: number;
    daysPlannedTrip: number;
    passportValidUntil?: string;
    mustCarryBothPassports: boolean;
  };
}

export function evaluateVisaCoverage(
  trip: {
    destination: string;
    region: string;
    startDate: string;
    endDate: string;
  },
  vault: {
    visas: any[];
    documents: any[];
    travelRecords: any[];
  }
): CoverageEvaluation {
  const normDest = trip.destination.trim().toLowerCase();
  const normRegion = trip.region.trim().toUpperCase();

  // Find candidate visas matching region or destination country
  const candidateVisas = vault.visas.filter((v) => {
    const vRegion = (v.region || '').trim().toUpperCase();
    const vCountry = (v.country || '').trim().toLowerCase();
    return (
      vRegion === normRegion ||
      vCountry === normDest ||
      (normRegion === 'SCHENGEN' && (vRegion === 'SCHENGEN' || vCountry.includes('france') || vCountry.includes('germany') || vCountry.includes('spain') || vCountry.includes('italy')))
    );
  });

  // Sort candidate visas: prioritize one that covers the trip dates, then latest validUntil
  candidateVisas.sort((a, b) => {
    const aCovers = (a.validFrom <= trip.startDate && a.validUntil >= trip.endDate) ? 1 : 0;
    const bCovers = (b.validFrom <= trip.startDate && b.validUntil >= trip.endDate) ? 1 : 0;
    if (aCovers !== bCovers) return bCovers - aCovers;
    return (b.validUntil || '').localeCompare(a.validUntil || '');
  });

  if (candidateVisas.length === 0) {
    return {
      verdict: 'NOT_COVERED',
      reasons: [
        {
          severity: 'INFO',
          ruleId: 'NO_VISA_FOUND',
          message: `No active visa found in your vault covering ${trip.destination} (${trip.region}).`,
          fix: 'You must prepare a new visa application. Follow the requirements checklist below.',
        },
      ],
      details: {
        entriesRemaining: 0,
        daysRemainingInWindow: 0,
        daysPlannedTrip: daysBetween(trip.startDate, trip.endDate) + 1,
        mustCarryBothPassports: false,
      },
    };
  }

  // Evaluate candidate visa
  const visa = candidateVisas[0];
  const reasons: CoverageReason[] = [];

  // 1. Check Visa Validity Window
  if (isAfter(trip.startDate, visa.validUntil)) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'VISA_EXPIRED_BEFORE_TRIP',
      message: `Visa expires on ${visa.validUntil}, before your trip starts on ${trip.startDate}.`,
      fix: 'Apply for a new visa before traveling.',
    });
  } else if (isBefore(trip.startDate, visa.validFrom)) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'VISA_NOT_YET_VALID',
      message: `Visa is not valid until ${visa.validFrom}, but your trip starts on ${trip.startDate}.`,
      fix: 'Adjust departure date or apply for an updated visa.',
    });
  } else if (isAfter(trip.endDate, visa.validUntil)) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'VISA_EXPIRES_DURING_TRIP',
      message: `Visa expires on ${visa.validUntil}, prior to your planned return date of ${trip.endDate}.`,
      fix: 'Shorten your itinerary to depart before visa expiry, or apply for a fresh visa.',
    });
  }

  // 2. Check Entries Allowed vs Used
  const entryCheck = calculateEntries(visa, vault.travelRecords);
  if (entryCheck.isExhausted) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'VISA_ENTRIES_EXHAUSTED',
      message: `All allowed entries on this visa have been used (${entryCheck.used}/${entryCheck.allowed} used).`,
      fix: 'You cannot enter again on this visa. A new visa application is required.',
    });
  } else if (entryCheck.remaining === 1 && entryCheck.entriesType === 'SINGLE') {
    reasons.push({
      severity: 'INFO',
      ruleId: 'VISA_FINAL_ENTRY',
      message: 'This trip will use the final remaining single entry on this visa.',
      fix: 'Ensure no emergency departures from the region mid-trip.',
    });
  }

  // 3. Check Rolling Window & Stay Limits
  const stayCheck = calculateStay({
    pastRecords: vault.travelRecords,
    region: trip.region,
    maxStayDays: visa.maxStayDays,
    stayWindowDays: visa.stayWindowDays,
    referenceDate: trip.startDate,
    plannedTrip: {
      startDate: trip.startDate,
      endDate: trip.endDate,
    },
  });

  if (stayCheck.wouldExceedLimit) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'STAY_LIMIT_EXCEEDED',
      message: `Planned stay will reach ${stayCheck.maxDaysReachedDuringTrip} days, exceeding the allowed ${visa.maxStayDays}-day limit (breached around ${stayCheck.firstExceededDate}).`,
      fix: `Shorten your stay by at least ${stayCheck.maxDaysReachedDuringTrip - visa.maxStayDays} days or reschedule after older visits fall outside the 180-day window.`,
    });
  }

  // 4. Check Passport Linkage & Validity Margin
  const linkage = checkPassportLinkage(visa, vault.documents);
  const passportDoc = linkage.currentPassportDoc || linkage.linkedPassportDoc;

  let passportExpiry: string | undefined = undefined;

  if (!passportDoc) {
    reasons.push({
      severity: 'BLOCKER',
      ruleId: 'PASSPORT_MISSING_IN_VAULT',
      message: 'No passport document found in your vault.',
      fix: 'Upload your current passport scan to complete verification.',
    });
  } else {
    const pData =
      typeof passportDoc.extractedData === 'string'
        ? JSON.parse(passportDoc.extractedData || '{}')
        : passportDoc.extractedData || {};

    passportExpiry = pData.expiryDate;
    const passportIssueDate = pData.issueDate;

    if (passportExpiry) {
      const daysAfterReturn = daysBetween(trip.endDate, passportExpiry);

      if (isBefore(passportExpiry, trip.endDate)) {
        reasons.push({
          severity: 'BLOCKER',
          ruleId: 'PASSPORT_EXPIRES_BEFORE_TRIP_END',
          message: `Your passport expires on ${passportExpiry}, before your planned return date of ${trip.endDate}.`,
          fix: 'You cannot travel on an expired passport. Renew your passport immediately.',
        });
      } else if (normRegion === 'SCHENGEN' && daysAfterReturn < 90) {
        // Schengen 3-month rule (90 days beyond planned departure)
        reasons.push({
          severity: 'BLOCKER',
          ruleId: 'PASSPORT_MARGIN_SCHENGEN_FAIL',
          message: `Passport expires on ${passportExpiry} (${daysAfterReturn} days after return). Schengen law mandates at least 3 months (90 days) validity beyond departure.`,
          fix: 'Renew your passport before this trip. Consulates and border control strictly enforce this.',
        });
      } else if (daysAfterReturn < 180) {
        reasons.push({
          severity: 'WARNING',
          ruleId: 'PASSPORT_MARGIN_WARNING',
          message: `Passport expires within 6 months of travel (${passportExpiry}). Some airlines may flag this at check-in.`,
          fix: 'We recommend renewing your passport to avoid airline check-in boarding issues.',
        });
      }
    }

    // Schengen 10-year issuance rule
    if (normRegion === 'SCHENGEN' && passportIssueDate) {
      const tenYearsAfterIssue = addMonthsString(passportIssueDate, 120);
      if (isAfter(trip.endDate, tenYearsAfterIssue)) {
        reasons.push({
          severity: 'BLOCKER',
          ruleId: 'PASSPORT_OVER_10_YEARS_OLD',
          message: `Passport was issued on ${passportIssueDate} (>10 years ago). Schengen rules require passports issued within the last 10 years.`,
          fix: 'You must obtain a newly issued passport before traveling.',
        });
      }
    }
  }

  // 5. Must Carry Both Passports Notification
  if (linkage.mustCarryBothPassports) {
    reasons.push({
      severity: 'WARNING',
      ruleId: 'MUST_CARRY_BOTH_PASSPORTS',
      message: `Your valid visa is stamped in your previous passport (${linkage.passportNumberUsed}).`,
      fix: 'You must physically carry BOTH your old passport (holding the visa) AND your new active passport to board and clear immigration.',
    });
  }

  // Verdict calculation
  const hasBlocker = reasons.some((r) => r.severity === 'BLOCKER');
  const hasWarning = reasons.some((r) => r.severity === 'WARNING');

  let verdict: 'COVERED' | 'PARTIAL' | 'NOT_COVERED' = 'COVERED';
  if (hasBlocker || hasWarning) {
    verdict = 'PARTIAL';
  }

  return {
    verdict,
    matchedVisa: visa,
    reasons,
    details: {
      entriesRemaining: entryCheck.remaining,
      daysRemainingInWindow: stayCheck.daysRemainingAsOfDate,
      daysPlannedTrip: daysBetween(trip.startDate, trip.endDate) + 1,
      passportValidUntil: passportExpiry,
      mustCarryBothPassports: linkage.mustCarryBothPassports,
    },
  };
}
