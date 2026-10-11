import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const body = await req.json();
    const { acknowledgedByAgent, agentNote } = body;

    const updatedIssue = await prisma.caseIssue.update({
      where: { id: issueId },
      data: {
        ...(acknowledgedByAgent !== undefined && { acknowledgedByAgent: Boolean(acknowledgedByAgent) }),
        ...(agentNote !== undefined && { agentNote }),
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (err: any) {
    console.error('API /issues PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
