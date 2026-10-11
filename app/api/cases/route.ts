import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { IMPACT_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const destinationFilter = searchParams.get('destination');
    const search = searchParams.get('search')?.toLowerCase();
    const hasBlockersFilter = searchParams.get('hasBlockers');

    const allCases = await prisma.case.findMany({
      include: {
        trip: {
          include: {
            user: {
              include: {
                travelers: true,
              },
            },
            readinessResults: {
              orderBy: { generatedAt: 'desc' },
              take: 1,
            },
          },
        },
        caseIssues: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        statusHistory: {
          orderBy: { at: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Only process valid cases with an associated trip
    const validCases = allCases.filter((c) => Boolean(c.trip));

    // Compute Impact Metrics across all cases in the database
    let totalScoreSum = 0;
    let totalBlockers = 0;
    let totalSharedDocsCount = 0;

    for (const c of validCases) {
      const latestScore = c.trip?.readinessResults?.[0]?.score ?? 70;
      totalScoreSum += latestScore;

      const blockersInCase = (c.caseIssues || []).filter((i) => i.severity === 'BLOCKER').length;
      totalBlockers += blockersInCase;

      let sharedDocIds: string[] = [];
      try {
        sharedDocIds = JSON.parse(c.sharedDocumentIds || '[]');
      } catch {
        sharedDocIds = [];
      }
      totalSharedDocsCount += Math.max(sharedDocIds.length, 3); // Average 3 docs minimum
    }

    const totalCases = validCases.length;
    const avgScore = totalCases > 0 ? Math.round(totalScoreSum / totalCases) : 0;

    // Time savings calculated from lib/config.ts
    const totalMinutesSaved =
      totalCases * IMPACT_CONFIG.minutesSavedPerCaseBase +
      totalSharedDocsCount * IMPACT_CONFIG.minutesSavedPerDocument +
      totalBlockers * IMPACT_CONFIG.minutesSavedPerBlockerFound;

    const totalHoursSaved = (totalMinutesSaved / 60).toFixed(1);
    const estimatedCostSavingsUsd = Math.round((totalMinutesSaved / 60) * IMPACT_CONFIG.hourlyRateUsd);

    // Apply Filters for table display
    let filtered = validCases.filter((c) => {
      const travelerName =
        c.trip?.user?.travelers?.[0]?.fullName?.toLowerCase() ||
        c.trip?.user?.name?.toLowerCase() ||
        'applicant';
      const caseCode = (c.caseCode || '').toLowerCase();
      const dest = (c.trip?.destination || '').toLowerCase();

      if (statusFilter && statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }

      if (destinationFilter && destinationFilter !== 'ALL' && !dest.includes(destinationFilter.toLowerCase())) {
        return false;
      }

      if (hasBlockersFilter === 'true') {
        const hasBlocker = c.caseIssues.some((i) => i.severity === 'BLOCKER');
        if (!hasBlocker) return false;
      }

      if (search) {
        return travelerName.includes(search) || caseCode.includes(search) || dest.includes(search);
      }

      return true;
    });

    return NextResponse.json({
      cases: filtered,
      impact: {
        totalCasesProcessed: totalCases,
        averageReadinessScore: avgScore,
        blockersCaughtBeforeSubmission: totalBlockers,
        estimatedStaffTimeSavedMinutes: totalMinutesSaved,
        estimatedStaffTimeSavedHours: totalHoursSaved,
        estimatedCostSavingsUsd,
        assumptions: {
          minutesPerDoc: IMPACT_CONFIG.minutesSavedPerDocument,
          minutesPerBlocker: IMPACT_CONFIG.minutesSavedPerBlockerFound,
          minutesPerCaseBase: IMPACT_CONFIG.minutesSavedPerCaseBase,
          hourlyRateUsd: IMPACT_CONFIG.hourlyRateUsd,
          isEstimate: true,
        },
      },
    });
  } catch (err: any) {
    console.error('API /cases GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
