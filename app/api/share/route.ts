import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { APP_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tripId,
      consentAccepted,
      sharedDocumentIds,
      issues = [],
    } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
    }

    if (!consentAccepted) {
      return NextResponse.json(
        { error: 'Explicit applicant consent is strictly required to transmit case documents' },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        readinessResults: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Generate unique Case Code e.g. VV-2026-0043
    const count = await prisma.case.count();
    const caseNumber = String(count + 43).padStart(4, '0');
    const caseCode = `VV-2026-${caseNumber}`;

    const newCase = await prisma.case.create({
      data: {
        caseCode,
        tripId,
        status: 'NEW',
        consentAcceptedAt: new Date(),
        consentTextVersion: APP_CONFIG.consentVersion,
        sharedDocumentIds: JSON.stringify(sharedDocumentIds || []),
      },
    });

    // Populate Case Issues from evaluation problems
    for (const issue of issues) {
      await prisma.caseIssue.create({
        data: {
          caseId: newCase.id,
          severity: issue.severity || 'WARNING',
          ruleId: issue.id || 'GEN-ISSUE',
          message: issue.title || issue.message || 'Issue detected in dossier',
          fixSuggestion: issue.fix || issue.fixSuggestion || 'Review required',
        },
      });
    }

    // Add initial status history
    await prisma.caseStatusHistory.create({
      data: {
        caseId: newCase.id,
        status: 'NEW',
      },
    });

    // Welcome message from agency system
    await prisma.caseMessage.create({
      data: {
        caseId: newCase.id,
        from: 'AGENCY',
        text: `Welcome to ${APP_CONFIG.agencyName}. Your verified case pack (${caseCode}) has been received. Our visa specialists are currently inspecting your structured details.`,
      },
    });

    // Update trip status to SHARED
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'SHARED' },
    });

    return NextResponse.json({
      success: true,
      caseId: newCase.id,
      caseCode: newCase.caseCode,
    });
  } catch (err: any) {
    console.error('API /share error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
