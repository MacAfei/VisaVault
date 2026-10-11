import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateStay } from '@/lib/visa/stayCounter';
import { getTodayString } from '@/lib/clock';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = (searchParams.get('region') || 'SCHENGEN').toUpperCase();

    const traveler = await prisma.traveler.findFirst();
    if (!traveler) {
      return NextResponse.json({ error: 'No traveler found' }, { status: 404 });
    }

    const records = await prisma.travelRecord.findMany({
      where: { travelerId: traveler.id },
      orderBy: { entryDate: 'desc' },
    });

    const stayStats = calculateStay({
      pastRecords: records,
      region,
      maxStayDays: 90,
      stayWindowDays: 180,
      referenceDate: getTodayString(),
    });

    return NextResponse.json({
      traveler,
      records,
      stayStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region = 'SCHENGEN', entryDate, exitDate, notes } = body;

    if (!entryDate) {
      return NextResponse.json({ error: 'Entry date is required' }, { status: 400 });
    }

    const traveler = await prisma.traveler.findFirst();
    if (!traveler) {
      return NextResponse.json({ error: 'No traveler found' }, { status: 404 });
    }

    const newRecord = await prisma.travelRecord.create({
      data: {
        travelerId: traveler.id,
        region: region.toUpperCase(),
        entryDate,
        exitDate: exitDate || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, record: newRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await prisma.travelRecord.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
