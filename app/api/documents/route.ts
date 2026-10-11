import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildReadinessAssessment } from '@/lib/readiness/build';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const travelerId = searchParams.get('travelerId');

    const traveler = travelerId
      ? await prisma.traveler.findUnique({ where: { id: travelerId } })
      : await prisma.traveler.findFirst();

    if (!traveler) {
      return NextResponse.json({ error: 'No traveler found' }, { status: 404 });
    }

    const documents = await prisma.document.findMany({
      where: { travelerId: traveler.id },
      include: {
        visa: true,
        supersededBy: true,
        supersededDocs: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      traveler,
      documents,
    });
  } catch (err: any) {
    console.error('API /documents GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      travelerId: reqTravelerId,
      type,
      fileUrl,
      extractedData,
      confidenceNotes,
      userEdited = false,
    } = body;

    const traveler = reqTravelerId
      ? await prisma.traveler.findUnique({ where: { id: reqTravelerId } })
      : await prisma.traveler.findFirst();

    if (!traveler) {
      return NextResponse.json({ error: 'No traveler account found' }, { status: 404 });
    }

    const dataObj =
      typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData || {};

    let version = 1;
    let oldPassportToSupersede: string | null = null;

    // Special logic for new PASSPORT upload:
    // "uploading a new passport archives the old one and re-evaluates all affected trips"
    if (type === 'PASSPORT') {
      const existingActivePassport = await prisma.document.findFirst({
        where: {
          travelerId: traveler.id,
          type: 'PASSPORT',
          supersededById: null,
        },
        orderBy: { version: 'desc' },
      });

      if (existingActivePassport) {
        version = existingActivePassport.version + 1;
        oldPassportToSupersede = existingActivePassport.id;
      }
    }

    // Create Document
    const newDoc = await prisma.document.create({
      data: {
        travelerId: traveler.id,
        type,
        fileUrl: fileUrl || '/samples/sample_passport.svg',
        extractedData: JSON.stringify(dataObj),
        confidenceNotes: confidenceNotes || null,
        userEdited: Boolean(userEdited),
        version,
      },
    });

    // If an old passport was active, link it as superseded
    if (oldPassportToSupersede) {
      await prisma.document.update({
        where: { id: oldPassportToSupersede },
        data: { supersededById: newDoc.id },
      });
    }

    // If it's a VISA, create or update the Visa record
    if (type === 'VISA') {
      const activePassport = await prisma.document.findFirst({
        where: { travelerId: traveler.id, type: 'PASSPORT', supersededById: null },
      });

      await prisma.visa.create({
        data: {
          documentId: newDoc.id,
          travelerId: traveler.id,
          passportDocumentId: activePassport?.id || null,
          country: dataObj.country || 'Schengen',
          region: (dataObj.region || 'SCHENGEN').toUpperCase(),
          visaType: dataObj.visaType || 'TOURIST',
          entries: (dataObj.entries || 'MULTIPLE').toUpperCase(),
          validFrom: dataObj.validFrom || '2026-01-01',
          validUntil: dataObj.validUntil || '2026-12-31',
          maxStayDays: parseInt(dataObj.maxStayDays, 10) || 90,
          stayWindowDays: dataObj.stayWindowDays ? parseInt(dataObj.stayWindowDays, 10) : 180,
          status: 'ACTIVE',
        },
      });
    }

    // Re-evaluate affected trips for this traveler
    const affectedTrips = await prisma.trip.findMany({
      where: {
        travelerIds: { contains: traveler.id },
      },
    });

    if (affectedTrips.length > 0) {
      const allVaultDocs = await prisma.document.findMany({
        where: { travelerId: traveler.id },
      });
      const allVaultVisas = await prisma.visa.findMany({
        where: { travelerId: traveler.id },
      });
      const allTravelRecs = await prisma.travelRecord.findMany({
        where: { travelerId: traveler.id },
      });

      for (const trip of affectedTrips) {
        const assessment = buildReadinessAssessment(
          trip,
          traveler,
          {
            visas: allVaultVisas,
            documents: allVaultDocs,
            travelRecords: allTravelRecs,
          }
        );

        // Update or create ReadinessResult
        const existingResult = await prisma.readinessResult.findFirst({
          where: { tripId: trip.id },
        });

        if (existingResult) {
          await prisma.readinessResult.update({
            where: { id: existingResult.id },
            data: {
              verdict: assessment.verdict,
              score: assessment.score,
              itemsJson: JSON.stringify(assessment),
              generatedAt: new Date(),
            },
          });
        } else {
          await prisma.readinessResult.create({
            data: {
              tripId: trip.id,
              verdict: assessment.verdict,
              score: assessment.score,
              itemsJson: JSON.stringify(assessment),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      document: newDoc,
      affectedTripsUpdated: affectedTrips.length,
    });
  } catch (err: any) {
    console.error('API /documents POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('API /documents DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
