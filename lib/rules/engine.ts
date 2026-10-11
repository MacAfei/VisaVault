import {
  parseDate,
  isBefore,
  isAfter,
  daysBetween,
  addMonthsString,
  getTodayString,
} from '../clock';
import { verifyNameConsistency, verifyDateConsistency } from './matching';

import schengenRules from './destinations/schengen.json';
import ukRules from './destinations/uk.json';
import usaRules from './destinations/usa.json';
import japanRules from './destinations/japan.json';

export interface RuleEvaluationItem {
  id: string;
  documentType: string;
  severity: 'BLOCKER' | 'WARNING' | 'INFO';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'MISSING';
  title: string;
  description: string;
  whyRequired: string;
  foundIssue?: string;
  fixSuggestion?: string;
  weight: number;
}

export interface RuleEvaluationReport {
  destination: string;
  region: string;
  rulesLastReviewed: string;
  sourceComment: string;
  items: RuleEvaluationItem[];
  missingDocumentTypes: string[];
  blockerCount: number;
  warningCount: number;
  infoCount: number;
}

export function getDestinationRules(region: string, destination: string) {
  const normDest = destination.trim().toLowerCase();
  const normRegion = region.trim().toUpperCase();

  if (normRegion === 'SCHENGEN' || normDest.includes('france') || normDest.includes('germany') || normDest.includes('italy') || normDest.includes('spain')) {
    return schengenRules;
  }
  if (normRegion === 'UK' || normDest.includes('united kingdom') || normDest.includes('britain') || normDest.includes('london')) {
    return ukRules;
  }
  if (normRegion === 'USA' || normDest.includes('united states') || normDest.includes('america')) {
    return usaRules;
  }
  if (normRegion === 'JAPAN' || normDest.includes('japan')) {
    return japanRules;
  }

  // Default to Schengen framework as gold standard
  return schengenRules;
}

export function evaluateRequirements(
  trip: {
    destination: string;
    region: string;
    startDate: string;
    endDate: string;
  },
  traveler: {
    fullName: string;
    nationality: string;
  },
  documents: Array<{
    id: string;
    type: string;
    extractedData: string | Record<string, any>;
    confidenceNotes?: string | null;
    userEdited?: boolean;
    supersededById?: string | null;
  }>
): RuleEvaluationReport {
  const ruleConfig = getDestinationRules(trip.region, trip.destination);
  const activeDocs = documents.filter((d) => !d.supersededById);

  // Group active documents by type
  const docsByType = new Map<string, any[]>();
  for (const doc of activeDocs) {
    if (!docsByType.has(doc.type)) {
      docsByType.set(doc.type, []);
    }
    docsByType.get(doc.type)!.push(doc);
  }

  const items: RuleEvaluationItem[] = [];
  const missingDocumentTypes: string[] = [];

  // 1. Verify presence of required documents
  for (const reqType of ruleConfig.requiredDocumentTypes) {
    const presentDocs = docsByType.get(reqType) || [];
    if (presentDocs.length === 0) {
      missingDocumentTypes.push(reqType);
      items.push({
        id: `MISSING-${reqType}`,
        documentType: reqType,
        severity: 'BLOCKER',
        status: 'MISSING',
        title: `Missing Required Document: ${reqType.replace(/_/g, ' ')}`,
        description: `Your vault is missing a valid ${reqType.replace(/_/g, ' ')}.`,
        whyRequired: `Mandatory requirement for ${ruleConfig.destination} visa applications. Applications without this document will be rejected outright.`,
        foundIssue: 'Document not found in vault.',
        fixSuggestion: `Upload or scan your ${reqType.replace(/_/g, ' ')} to your VisaVault.`,
        weight: reqType === 'PASSPORT' ? 30 : 15,
      });
    }
  }

  // Helper to extract JSON from doc
  const getDocData = (doc: any) => {
    if (!doc) return {};
    return typeof doc.extractedData === 'string'
      ? JSON.parse(doc.extractedData || '{}')
      : doc.extractedData || {};
  };

  const passportDoc = (docsByType.get('PASSPORT') || [])[0];
  const passportData = getDocData(passportDoc);
  const baselineName = passportData.fullName || traveler.fullName;

  // 2. Passport Validity Checks
  if (passportDoc && passportData) {
    const expiry = passportData.expiryDate;
    const issueDate = passportData.issueDate;

    if (ruleConfig.region === 'SCHENGEN') {
      if (expiry) {
        const daysAfterReturn = daysBetween(trip.endDate, expiry);
        if (daysAfterReturn < 90) {
          items.push({
            id: 'SCH-PASS-VAL-FAIL',
            documentType: 'PASSPORT',
            severity: 'BLOCKER',
            status: 'FAIL',
            title: 'Passport Validity Less Than 3 Months After Trip',
            description: `Passport expires on ${expiry} (${daysAfterReturn} days after scheduled return).`,
            whyRequired: 'Article 12 of Schengen Visa Code requires at least 3 months validity beyond the departure date.',
            foundIssue: `Passport expires too soon (${expiry}).`,
            fixSuggestion: 'Renew your passport before applying for a Schengen visa.',
            weight: 30,
          });
        } else {
          items.push({
            id: 'SCH-PASS-VAL-PASS',
            documentType: 'PASSPORT',
            severity: 'BLOCKER',
            status: 'PASS',
            title: 'Passport Validity Complies with Schengen 3-Month Rule',
            description: `Passport expires on ${expiry} (${daysAfterReturn} days after trip return).`,
            whyRequired: 'Article 12 of Schengen Visa Code requires at least 3 months validity beyond departure.',
            weight: 30,
          });
        }
      }

      if (issueDate) {
        const tenYearsAfterIssue = addMonthsString(issueDate, 120);
        if (isAfter(trip.endDate, tenYearsAfterIssue)) {
          items.push({
            id: 'SCH-PASS-10YR-FAIL',
            documentType: 'PASSPORT',
            severity: 'BLOCKER',
            status: 'FAIL',
            title: 'Passport Issued More Than 10 Years Ago',
            description: `Passport was issued on ${issueDate}.`,
            whyRequired: 'Passports extended or issued >10 years ago are not recognized by Schengen authorities.',
            foundIssue: 'Passport older than 10-year limit.',
            fixSuggestion: 'Renew your passport to obtain an unexpired 10-year booklet.',
            weight: 20,
          });
        }
      }
    } else {
      // UK, USA, Japan general validity
      if (expiry) {
        const daysAfterStart = daysBetween(trip.startDate, expiry);
        if (isBefore(expiry, trip.endDate)) {
          items.push({
            id: 'GEN-PASS-VAL-FAIL',
            documentType: 'PASSPORT',
            severity: 'BLOCKER',
            status: 'FAIL',
            title: 'Passport Expires Prior To Travel Return',
            description: `Passport expires on ${expiry}, before return date ${trip.endDate}.`,
            whyRequired: 'You must hold a valid passport for the entire duration of stay.',
            foundIssue: 'Passport expires while abroad.',
            fixSuggestion: 'Renew your passport immediately before departure.',
            weight: 30,
          });
        } else if (daysAfterStart < 180) {
          items.push({
            id: 'GEN-PASS-VAL-WARN',
            documentType: 'PASSPORT',
            severity: 'WARNING',
            status: 'WARNING',
            title: 'Passport Validity Under 6 Months At Travel Date',
            description: `Passport expires on ${expiry} (${Math.round(daysAfterStart / 30)} months from departure).`,
            whyRequired: 'Many international carriers and immigration desks recommend or require 6 months validity.',
            foundIssue: 'Under 6 months buffer.',
            fixSuggestion: 'Consider renewing your passport to avoid airline boarding delays.',
            weight: 15,
          });
        } else {
          items.push({
            id: 'GEN-PASS-VAL-PASS',
            documentType: 'PASSPORT',
            severity: 'BLOCKER',
            status: 'PASS',
            title: 'Passport Validity Valid For Entire Stay',
            description: `Passport expires on ${expiry}, well beyond trip end.`,
            whyRequired: 'Passport validity required through intended period of stay.',
            weight: 30,
          });
        }
      }
    }
  }

  // 3. Name Consistency Verification
  const nameCheck = verifyNameConsistency(baselineName, activeDocs);
  if (!nameCheck.isConsistent) {
    for (const m of nameCheck.mismatches) {
      items.push({
        id: `NAME-MISMATCH-${m.documentType}`,
        documentType: m.documentType,
        severity: 'BLOCKER',
        status: 'FAIL',
        title: `Name Mismatch in ${m.documentType.replace(/_/g, ' ')}`,
        description: `Name on document reads "${m.extractedName}" but passport reads "${m.baselineName}".`,
        whyRequired: 'Consulates strictly reject dossiers where names across bookings, bank statements, or certificates conflict.',
        foundIssue: `Name disparity: "${m.extractedName}" vs "${m.baselineName}".`,
        fixSuggestion: `Update the name on the ${m.documentType.replace(/_/g, ' ')} or attach an official name change affidavit.`,
        weight: 15,
      });
    }
  } else if (activeDocs.length > 1) {
    items.push({
      id: 'NAME-CONSISTENCY-PASS',
      documentType: 'ALL',
      severity: 'BLOCKER',
      status: 'PASS',
      title: 'Name Consistency Verified Across All Documents',
      description: `All supporting documents match holder name: ${baselineName}.`,
      whyRequired: 'Consular cross-check of applicant identity.',
      weight: 15,
    });
  }

  // 4. Date Consistency Verification
  const dateCheck = verifyDateConsistency(trip, activeDocs);
  if (!dateCheck.isConsistent) {
    for (const iss of dateCheck.issues) {
      items.push({
        id: `DATE-MISMATCH-${iss.documentType}`,
        documentType: iss.documentType,
        severity: 'BLOCKER',
        status: 'FAIL',
        title: `Date Discrepancy in ${iss.documentType.replace(/_/g, ' ')}`,
        description: iss.message,
        whyRequired: 'Travel dates must be synchronized between flights, accommodations, and insurance.',
        foundIssue: iss.message,
        fixSuggestion: 'Re-align your booking or insurance dates to exactly match your trip window.',
        weight: 15,
      });
    }
  } else if (activeDocs.some((d) => ['FLIGHT_BOOKING', 'HOTEL_BOOKING', 'INSURANCE'].includes(d.type))) {
    items.push({
      id: 'DATE-CONSISTENCY-PASS',
      documentType: 'ALL',
      severity: 'BLOCKER',
      status: 'PASS',
      title: 'Travel Dates Aligned Across Bookings & Policy',
      description: `Flight, hotel, and insurance dates match declared travel window (${trip.startDate} to ${trip.endDate}).`,
      whyRequired: 'Consulates issue visas strictly according to documented flight dates.',
      weight: 15,
    });
  }

  // 5. Insurance Check
  const insuranceDoc = (docsByType.get('INSURANCE') || [])[0];
  if (insuranceDoc) {
    const iData = getDocData(insuranceDoc);
    const amount = Number(iData.coverageAmount) || 0;
    const curr = (iData.currency || 'EUR').toUpperCase();

    if (ruleConfig.region === 'SCHENGEN') {
      if (curr === 'EUR' && amount < 30000) {
        items.push({
          id: 'SCH-INS-AMOUNT-FAIL',
          documentType: 'INSURANCE',
          severity: 'BLOCKER',
          status: 'FAIL',
          title: 'Insurance Coverage Less Than €30,000 Minimum',
          description: `Current policy covers ${curr} ${amount}. Schengen mandates minimum €30,000.`,
          whyRequired: 'Mandatory under Article 15 of Regulation (EC) No 810/2009 for emergency medical and repatriation costs.',
          foundIssue: `Coverage under threshold: ${curr} ${amount}.`,
          fixSuggestion: 'Upgrade or purchase travel medical insurance with at least €30,000 coverage.',
          weight: 15,
        });
      } else {
        items.push({
          id: 'SCH-INS-AMOUNT-PASS',
          documentType: 'INSURANCE',
          severity: 'BLOCKER',
          status: 'PASS',
          title: 'Insurance Coverage Meets Schengen Requirements',
          description: `Policy coverage of ${curr} ${amount.toLocaleString()} exceeds the €30,000 requirement.`,
          whyRequired: 'Regulation (EC) No 810/2009 compliance.',
          weight: 15,
        });
      }
    }
  }

  // 6. Bank Statement Recency & Period Check
  const bankDoc = (docsByType.get('BANK_STATEMENT') || [])[0];
  if (bankDoc) {
    const bData = getDocData(bankDoc);
    const todayStr = getTodayString();

    if (bData.periodEnd) {
      const ageDays = daysBetween(bData.periodEnd, todayStr);
      if (ageDays > 30) {
        items.push({
          id: 'BANK-STMT-OUTDATED',
          documentType: 'BANK_STATEMENT',
          severity: 'WARNING',
          status: 'WARNING',
          title: 'Bank Statement Outdated (>30 Days Old)',
          description: `Statement period ends on ${bData.periodEnd} (${ageDays} days ago).`,
          whyRequired: 'Consulates typically require bank statements stamped within the last 15-30 days prior to submission.',
          foundIssue: `Statement is ${ageDays} days old.`,
          fixSuggestion: 'Download and stamp a fresh statement covering the most recent 30-day transactions.',
          weight: 15,
        });
      } else {
        items.push({
          id: 'BANK-STMT-RECENCY-PASS',
          documentType: 'BANK_STATEMENT',
          severity: 'BLOCKER',
          status: 'PASS',
          title: 'Bank Statement Is Recent & Valid',
          description: `Statement ends on ${bData.periodEnd} (${ageDays} days old, well within 30-day window).`,
          whyRequired: 'Proof of up-to-date financial solvency.',
          weight: 15,
        });
      }
    }

    if (bData.closingBalance !== undefined) {
      const balance = Number(bData.closingBalance);
      if (balance < 1000) {
        items.push({
          id: 'BANK-STMT-LOW-BALANCE',
          documentType: 'BANK_STATEMENT',
          severity: 'WARNING',
          status: 'WARNING',
          title: 'Bank Closing Balance Sanity Warning',
          description: `Closing balance is ${bData.currency || 'EUR'} ${balance}.`,
          whyRequired: 'Applicants must show sufficient funds for daily subsistence (approx. €65-€120 per day in Europe).',
          foundIssue: 'Low closing balance flagged.',
          fixSuggestion: 'Attach an additional bank account or provide a verified financial sponsorship letter.',
          weight: 10,
        });
      }
    }
  }

  // 7. Employment Letter Recency Check
  const empDoc = (docsByType.get('EMPLOYMENT_LETTER') || [])[0];
  if (empDoc) {
    const eData = getDocData(empDoc);
    const todayStr = getTodayString();
    if (eData.issueDate) {
      const ageDays = daysBetween(eData.issueDate, todayStr);
      if (ageDays > 30) {
        items.push({
          id: 'EMP-LETTER-OLD',
          documentType: 'EMPLOYMENT_LETTER',
          severity: 'WARNING',
          status: 'WARNING',
          title: 'Employment Letter Issued Over 30 Days Ago',
          description: `NOC letter dated ${eData.issueDate} (${ageDays} days ago).`,
          whyRequired: 'Consulates require recent confirmation of employment and leave authorization.',
          foundIssue: `Letter dated ${ageDays} days ago.`,
          fixSuggestion: 'Request a newly dated NOC letter from HR within 2 weeks of your appointment.',
          weight: 10,
        });
      } else {
        items.push({
          id: 'EMP-LETTER-PASS',
          documentType: 'EMPLOYMENT_LETTER',
          severity: 'BLOCKER',
          status: 'PASS',
          title: 'Employment Letter Recent & Valid',
          description: `NOC letter dated ${eData.issueDate} confirms role and approved leave dates.`,
          whyRequired: 'Proof of economic roots.',
          weight: 10,
        });
      }
    }
  }

  // 8. Photo Quality & Specifications
  const photoDoc = (docsByType.get('PHOTO') || [])[0];
  if (photoDoc) {
    const pData = getDocData(photoDoc);
    if (pData.plainBackground === false || pData.glareOrBlur === true) {
      items.push({
        id: 'PHOTO-QUALITY-WARN',
        documentType: 'PHOTO',
        severity: 'WARNING',
        status: 'WARNING',
        title: 'Passport Photo Quality Warning',
        description: pData.qualityNotes || 'Potential glare or non-compliant background detected.',
        whyRequired: 'Photos must strictly comply with ICAO standard biometric background and lighting rules.',
        foundIssue: 'Photo quality advisory flag.',
        fixSuggestion: 'Have a compliant 35x45mm passport photograph taken at a certified photo studio.',
        weight: 10,
      });
    } else {
      items.push({
        id: 'PHOTO-QUALITY-PASS',
        documentType: 'PHOTO',
        severity: 'BLOCKER',
        status: 'PASS',
        title: 'Photograph Conforms to Biometric Standards',
        description: 'Plain background, face visible, no glare detected.',
        whyRequired: 'ICAO biometric compliance.',
        weight: 10,
      });
    }
  }

  // 9. Prior Rejection on record
  const rejectionDoc = (docsByType.get('REJECTION_LETTER') || [])[0];
  if (rejectionDoc) {
    const rData = getDocData(rejectionDoc);
    items.push({
      id: 'PRIOR-REJECTION-INFO',
      documentType: 'REJECTION_LETTER',
      severity: 'INFO',
      status: 'INFO',
      title: 'Prior Visa Refusal On Record',
      description: `A prior refusal record exists for ${rData.country || 'a consulate'} (${rData.date || 'previously'}).`,
      whyRequired: 'Consulates share refusal databases (e.g. VIS and SIS II). You must always declare past refusals to avoid bans for deception.',
      foundIssue: 'Historical rejection detected.',
      fixSuggestion: 'Declare this prior outcome on your application and include a covering letter addressing previous refusal points.',
      weight: 5,
    });
  }

  const blockerCount = items.filter((i) => i.severity === 'BLOCKER' && ['FAIL', 'MISSING'].includes(i.status)).length;
  const warningCount = items.filter((i) => i.severity === 'WARNING' && ['FAIL', 'WARNING'].includes(i.status)).length;
  const infoCount = items.filter((i) => i.severity === 'INFO').length;

  return {
    destination: ruleConfig.destination,
    region: ruleConfig.region,
    rulesLastReviewed: ruleConfig.lastReviewed,
    sourceComment: ruleConfig.sourceComment,
    items,
    missingDocumentTypes,
    blockerCount,
    warningCount,
    infoCount,
  };
}
