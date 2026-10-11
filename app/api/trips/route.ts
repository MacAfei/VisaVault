import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildReadinessAssessment } from '@/lib/readiness/build';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        trips: {
          include: {
            readinessResults: {
              orderBy: { generatedAt: 'desc' },
              take: 1,
            },
            cases: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user,
      trips: user.trips,
    });
  } catch (err: any) {
    console.error('API /trips GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, region, purpose = 'TOURISM', startDate, endDate, travelerIds } = body;

    if (!destination || !region || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: destination, region, startDate, endDate' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user account exists' }, { status: 404 });
    }

    const traveler = await prisma.traveler.findFirst({
      where: { userId: user.id },
    });

    if (!traveler) {
      return NextResponse.json({ error: 'No traveler exists' }, { status: 404 });
    }

    const assignedTravelerIds = travelerIds && travelerIds.length > 0 ? travelerIds : [traveler.id];

    // Create Trip
    const newTrip = await prisma.trip.create({
      data: {
        userId: user.id,
        destination,
        region: region.toUpperCase(),
        purpose,
        startDate,
        endDate,
        travelerIds: JSON.stringify(assignedTravelerIds),
        status: 'PLANNING',
      },
    });

    // Run Readiness Evaluation
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
      newTrip,
      traveler,
      {
        visas: vaultVisas,
        documents: vaultDocs,
        travelRecords,
      }
    );

    await prisma.readinessResult.create({
      data: {
        tripId: newTrip.id,
        verdict: assessment.verdict,
        score: assessment.score,
        itemsJson: JSON.stringify(assessment),
      },
    });

    return NextResponse.json({
      success: true,
      trip: newTrip,
      assessment,
    });
  } catch (err: any) {
    console.error('API /trips POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
