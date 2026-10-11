import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseItem = await prisma.case.findFirst({
      where: { OR: [{ id }, { caseCode: id }] },
    });

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const messages = await prisma.caseMessage.findMany({
      where: { caseId: caseItem.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { from = 'TRAVELER', text, updateStatusToNeedsFixes = false } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
    }

    const caseItem = await prisma.case.findFirst({
      where: { OR: [{ id }, { caseCode: id }] },
    });

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const message = await prisma.caseMessage.create({
      data: {
        caseId: caseItem.id,
        from: from.toUpperCase() === 'AGENCY' ? 'AGENCY' : 'TRAVELER',
        text: text.trim(),
      },
    });

    // If this is a fix request from the agency, automatically transition case status to NEEDS_FIXES
    if (updateStatusToNeedsFixes && caseItem.status !== 'NEEDS_FIXES') {
      await prisma.case.update({
        where: { id: caseItem.id },
        data: { status: 'NEEDS_FIXES' },
      });

      await prisma.caseStatusHistory.create({
        data: {
          caseId: caseItem.id,
          status: 'NEEDS_FIXES',
        },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error('API /cases/[id]/messages POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
