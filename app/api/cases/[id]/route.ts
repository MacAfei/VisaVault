import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find by case id or caseCode
    const caseItem = await prisma.case.findFirst({
      where: {
        OR: [{ id }, { caseCode: id }],
      },
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
        caseIssues: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          orderBy: { at: 'desc' },
        },
      },
    });

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const traveler = caseItem.trip.user.travelers[0];

    // Fetch shared documents
    let sharedDocIds: string[] = [];
    try {
      sharedDocIds = JSON.parse(caseItem.sharedDocumentIds || '[]');
    } catch {
      sharedDocIds = [];
    }

    let sharedDocs: any[] = [];
    if (sharedDocIds.length > 0) {
      sharedDocs = await prisma.document.findMany({
        where: { id: { in: sharedDocIds } },
        include: { visa: true },
      });
    } else if (traveler) {
      // Fallback: show active documents of traveler
      sharedDocs = await prisma.document.findMany({
        where: { travelerId: traveler.id, supersededById: null },
        include: { visa: true },
      });
    }

    // Also fetch traveler's relevant visa history from all documents/visas
    const visaHistory = traveler
      ? await prisma.visa.findMany({
          where: { travelerId: traveler.id },
          include: { document: true },
        })
      : [];

    return NextResponse.json({
      case: caseItem,
      traveler,
      sharedDocs,
      visaHistory,
    });
  } catch (err: any) {
    console.error('API /cases/[id] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    const existingCase = await prisma.case.findFirst({
      where: {
        OR: [{ id }, { caseCode: id }],
      },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Update status
    const updatedCase = await prisma.case.update({
      where: { id: existingCase.id },
      data: { status },
    });

    // Record status history
    await prisma.caseStatusHistory.create({
      data: {
        caseId: existingCase.id,
        status,
      },
    });

    // Add automated message to case history
    if (note) {
      await prisma.caseMessage.create({
        data: {
          caseId: existingCase.id,
          from: 'AGENCY',
          text: `Status updated to ${status}. Note: ${note}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (err: any) {
    console.error('API /cases/[id] PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingCase = await prisma.case.findFirst({
      where: {
        OR: [{ id }, { caseCode: id }],
      },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Delete case and its cascade children
    await prisma.case.delete({
      where: { id: existingCase.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Case pack and shared files deleted successfully pursuant to privacy rights.',
    });
  } catch (err: any) {
    console.error('API /cases/[id] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
