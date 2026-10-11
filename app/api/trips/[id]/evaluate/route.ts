import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildReadinessAssessment } from '@/lib/readiness/build';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
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
        cases: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const traveler = trip.user.travelers[0];
    if (!traveler) {
      return NextResponse.json({ error: 'No traveler linked to trip' }, { status: 404 });
    }

    const vaultDocs = await prisma.document.findMany({
      where: { travelerId: traveler.id },
    });
    const vaultVisas = await prisma.visa.findMany({
      where: { travelerId: traveler.id },
    });
    const travelRecords = await prisma.travelRecord.findMany({
      where: { travelerId: traveler.id },
    });

    const assessment = buildReadinessAssessment(
      trip,
      traveler,
      {
        visas: vaultVisas,
        documents: vaultDocs,
        travelRecords,
      }
    );

    // Save newly calculated ReadinessResult
    const updatedResult = await prisma.readinessResult.create({
      data: {
        tripId: trip.id,
        verdict: assessment.verdict,
        score: assessment.score,
        itemsJson: JSON.stringify(assessment),
      },
    });

    // Also update Trip status if needed
    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'EVALUATED' },
    });

    return NextResponse.json({
      success: true,
      assessment,
      resultId: updatedResult.id,
    });
  } catch (err: any) {
    console.error('API /trips/[id]/evaluate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Delegate GET to POST evaluation handler
  return POST(req, { params });
}
