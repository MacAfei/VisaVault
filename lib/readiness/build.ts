import {
  getTodayString,
  daysBetween,
  addDaysString,
  isBefore,
} from '../clock';
import { evaluateVisaCoverage, CoverageEvaluation } from '../visa/coverage';
import { evaluateRequirements, RuleEvaluationReport, RuleEvaluationItem } from '../rules/engine';
import { DOCUMENT_WEIGHTS } from '../config';

export type ReadinessVerdict = 'READY' | 'ALMOST_READY' | 'NEEDS_ACTION' | 'BLOCKED';

export interface ActionPlanItem {
  id: string;
  stepNumber: number;
  title: string;
  deadline: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  howToFix: string;
  whyThisMatters: string;
}

export interface GroupedChecklist {
  good: Array<{ id: string; title: string; description: string }>;
  missing: Array<{ id: string; title: string; description: string; fix: string }>;
  problems: Array<{ id: string; title: string; description: string; severity: string; fix: string }>;
  expiringSoon: Array<{ id: string; title: string; description: string; fix: string }>;
}

export interface ReadinessAssessment {
  tripId?: string;
  verdict: ReadinessVerdict;
  score: number;
  coverage: CoverageEvaluation;
  requirements?: RuleEvaluationReport;
  summaryMessage: string;
  checklist: GroupedChecklist;
  actionPlan: ActionPlanItem[];
  rulesLastReviewed: string;
  generatedAt: string;
}

export function buildReadinessAssessment(
  trip: {
    id?: string;
    destination: string;
    region: string;
    startDate: string;
    endDate: string;
    purpose?: string;
  },
  traveler: {
    id?: string;
    fullName: string;
    nationality: string;
  },
  vault: {
    visas: any[];
    documents: any[];
    travelRecords: any[];
  }
): ReadinessAssessment {
  const coverage = evaluateVisaCoverage(trip, vault);
  const todayStr = getTodayString();
  const daysUntilTrip = daysBetween(todayStr, trip.startDate);

  // CASE 1: Trip is fully covered by an existing visa!
  if (coverage.verdict === 'COVERED') {
    const checklist: GroupedChecklist = {
      good: [
        {
          id: 'COV-VISA-VALID',
          title: 'Existing Visa Covers Entire Travel Window',
          description: `Your ${coverage.matchedVisa?.visaType || 'Tourist'} visa (${coverage.matchedVisa?.country || trip.region}) is valid through ${coverage.matchedVisa?.validUntil}.`,
        },
        {
          id: 'COV-ENTRIES-OK',
          title: 'Sufficient Visa Entries Available',
          description: `${coverage.details.entriesRemaining === 999 ? 'Multiple' : coverage.details.entriesRemaining} entries available.`,
        },
        {
          id: 'COV-STAY-OK',
          title: 'Stay Within Permitted Limits',
          description: `Planned duration is ${coverage.details.daysPlannedTrip} days, well within permitted limits.`,
        },
        {
          id: 'COV-PASS-OK',
          title: 'Passport Validity Verified',
          description: `Active passport is valid through ${coverage.details.passportValidUntil || 'your return date'}.`,
        },
      ],
      missing: [],
      problems: [],
      expiringSoon: [],
    };

    const actionPlan: ActionPlanItem[] = [
      {
        id: 'PLAN-PACK-GO',
        stepNumber: 1,
        title: 'Review Travel Itinerary & Pack Documents',
        deadline: addDaysString(trip.startDate, -2),
        urgency: 'LOW',
        howToFix: 'Ensure your passport is carried and your flight confirmations are printed or on your phone.',
        whyThisMatters: 'Your existing visa already provides full entry privileges for this itinerary.',
      },
    ];

    if (coverage.details.mustCarryBothPassports) {
      checklist.expiringSoon.push({
        id: 'COV-DUAL-PASS',
        title: 'Carry Both Passports',
        description: 'Your valid visa is inside your previously issued passport.',
        fix: 'Bring your previous expired passport and your current renewed passport.',
      });
      actionPlan.unshift({
        id: 'PLAN-CARRY-BOTH',
        stepNumber: 1,
        title: 'Pack BOTH Old and New Passports',
        deadline: addDaysString(trip.startDate, -1),
        urgency: 'HIGH',
        howToFix: 'Pack the expired passport containing the visa sticker alongside your new active passport.',
        whyThisMatters: 'Airlines and border control need the valid visa page plus the active passport for entry stamping.',
      });
      actionPlan[1].stepNumber = 2;
    }

    return {
      tripId: trip.id,
      verdict: 'READY',
      score: 100,
      coverage,
      summaryMessage: 'Good to go! You already have an active visa that completely covers this trip.',
      checklist,
      actionPlan,
      rulesLastReviewed: '2026-04-15',
      generatedAt: todayStr,
    };
  }

  // CASE 2: Visa exists but has PARTIAL problems (e.g. passport expires too soon or stay limit breached)
  if (coverage.verdict === 'PARTIAL') {
    const checklist: GroupedChecklist = {
      good: [
        {
          id: 'COV-EXISTING-VISA',
          title: 'Matching Visa Found in Vault',
          description: `Found ${coverage.matchedVisa?.visaType || 'visa'} for ${coverage.matchedVisa?.country || trip.region} valid ${coverage.matchedVisa?.validFrom} to ${coverage.matchedVisa?.validUntil}.`,
        },
      ],
      missing: [],
      problems: [],
      expiringSoon: [],
    };

    const actionPlan: ActionPlanItem[] = [];
    let step = 1;

    let score = 80;

    for (const r of coverage.reasons) {
      if (r.severity === 'BLOCKER') {
        score -= 25;
        checklist.problems.push({
          id: r.ruleId,
          title: r.message,
          description: r.fix,
          severity: r.severity,
          fix: r.fix,
        });

        actionPlan.push({
          id: `PLAN-${r.ruleId}`,
          stepNumber: step++,
          title: r.ruleId.includes('PASSPORT') ? 'Renew Your Passport Urgently' : 'Adjust Itinerary or Reapply for Visa',
          deadline: addDaysString(todayStr, Math.max(3, Math.min(30, daysUntilTrip - 10))),
          urgency: 'HIGH',
          howToFix: r.fix,
          whyThisMatters: r.message,
        });
      } else if (r.severity === 'WARNING') {
        score -= 10;
        checklist.expiringSoon.push({
          id: r.ruleId,
          title: r.message,
          description: r.fix,
          fix: r.fix,
        });
      }
    }

    score = Math.max(20, Math.min(score, 75));

    return {
      tripId: trip.id,
      verdict: 'BLOCKED',
      score,
      coverage,
      summaryMessage: 'Visa exists in your vault, but critical conditions prevent travel (e.g. passport expiry or stay limit).',
      checklist,
      actionPlan,
      rulesLastReviewed: '2026-04-15',
      generatedAt: todayStr,
    };
  }

  // CASE 3: NO VISA (NOT_COVERED) - Evaluate Full Destination Requirements
  const reqReport = evaluateRequirements(trip, traveler, vault.documents);

  const checklist: GroupedChecklist = {
    good: [],
    missing: [],
    problems: [],
    expiringSoon: [],
  };

  for (const item of reqReport.items) {
    if (item.status === 'PASS') {
      checklist.good.push({
        id: item.id,
        title: item.title,
        description: item.description,
      });
    } else if (item.status === 'MISSING') {
      checklist.missing.push({
        id: item.id,
        title: item.title,
        description: item.description,
        fix: item.fixSuggestion || 'Upload required document to vault.',
      });
    } else if (item.status === 'FAIL' || item.severity === 'BLOCKER') {
      checklist.problems.push({
        id: item.id,
        title: item.title,
        description: item.description,
        severity: item.severity,
        fix: item.fixSuggestion || 'Correct discrepancy.',
      });
    } else if (item.status === 'WARNING') {
      checklist.expiringSoon.push({
        id: item.id,
        title: item.title,
        description: item.description,
        fix: item.fixSuggestion || 'Update document.',
      });
    }
  }

  // Compute readiness score
  const totalWeight = Object.values(DOCUMENT_WEIGHTS).reduce((a, b) => a + b, 0);
  let achievedWeight = 0;

  for (const doc of vault.documents) {
    if (!doc.supersededById && DOCUMENT_WEIGHTS[doc.type]) {
      // Check if doc had a blocker failure
      const hadBlocker = checklist.problems.some((p) => p.id.includes(doc.type));
      if (!hadBlocker) {
        achievedWeight += DOCUMENT_WEIGHTS[doc.type];
      } else {
        achievedWeight += Math.floor(DOCUMENT_WEIGHTS[doc.type] * 0.4);
      }
    }
  }

  let calculatedScore = Math.round((achievedWeight / totalWeight) * 100);
  calculatedScore = Math.max(10, Math.min(calculatedScore, 98));

  // Determine Verdict
  let verdict: ReadinessVerdict = 'NEEDS_ACTION';
  if (reqReport.blockerCount > 2 || checklist.missing.length > 2) {
    verdict = 'BLOCKED';
  } else if (reqReport.blockerCount === 0 && reqReport.warningCount === 0) {
    verdict = 'READY';
  } else if (reqReport.blockerCount === 0) {
    verdict = 'ALMOST_READY';
  } else {
    verdict = 'NEEDS_ACTION';
  }

  // Build Ordered Action Plan
  const actionPlan: ActionPlanItem[] = [];
  let stepNumber = 1;

  // 1. Passport fixes
  const passportProblem = checklist.problems.find((p) => p.id.includes('PASS') || p.id.includes('PASSPORT'));
  if (passportProblem || checklist.missing.some((m) => m.id.includes('PASSPORT'))) {
    actionPlan.push({
      id: 'ACTION-RENEW-PASS',
      stepNumber: stepNumber++,
      title: 'Renew Passport Immediately',
      deadline: addDaysString(todayStr, Math.max(5, Math.min(30, daysUntilTrip - 45))),
      urgency: 'HIGH',
      howToFix: 'Book an expedited passport renewal appointment at your national passport office.',
      whyThisMatters: 'Consulates will reject visa applications immediately if the passport validity rules are not met.',
    });
  }

  // 2. Upload missing documents
  for (const missingItem of checklist.missing) {
    if (missingItem.id.includes('PASSPORT')) continue;
    actionPlan.push({
      id: `ACTION-UPLOAD-${missingItem.id}`,
      stepNumber: stepNumber++,
      title: `Obtain & Upload: ${missingItem.title.replace('Missing Required Document: ', '')}`,
      deadline: addDaysString(todayStr, Math.max(7, Math.min(25, daysUntilTrip - 20))),
      urgency: missingItem.id.includes('BANK') || missingItem.id.includes('EMPLOYMENT') ? 'HIGH' : 'MEDIUM',
      howToFix: missingItem.fix,
      whyThisMatters: missingItem.description,
    });
  }

  // 3. Fix problems/mismatches
  for (const prob of checklist.problems) {
    if (prob.id.includes('PASS')) continue;
    actionPlan.push({
      id: `ACTION-FIX-${prob.id}`,
      stepNumber: stepNumber++,
      title: `Resolve Issue: ${prob.title}`,
      deadline: addDaysString(todayStr, Math.max(5, Math.min(20, daysUntilTrip - 15))),
      urgency: 'HIGH',
      howToFix: prob.fix,
      whyThisMatters: prob.description,
    });
  }

  // 4. Submit to Agency
  actionPlan.push({
    id: 'ACTION-SHARE-AGENCY',
    stepNumber: stepNumber++,
    title: 'Share Verified Case Pack with Agency for Fast Pre-Vetting',
    deadline: addDaysString(todayStr, Math.max(10, Math.min(20, daysUntilTrip - 10))),
    urgency: 'MEDIUM',
    howToFix: 'Click "Share with agency" on this trip page with one-click consent.',
    whyThisMatters: 'Agency staff will pre-vet your dossier and book your consular submission slot with zero typing.',
  });

  return {
    tripId: trip.id,
    verdict,
    score: calculatedScore,
    coverage,
    requirements: reqReport,
    summaryMessage: `No active visa covers this trip to ${trip.destination}. A new visa application dossier is required.`,
    checklist,
    actionPlan,
    rulesLastReviewed: reqReport.rulesLastReviewed,
    generatedAt: todayStr,
  };
}
