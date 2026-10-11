import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const traveler = await prisma.traveler.findFirst();
    if (!traveler) {
      return NextResponse.json({ error: 'No traveler found' }, { status: 404 });
    }

    // Delete all documents, visas, and travel records for this traveler
    await prisma.visa.deleteMany({
      where: { travelerId: traveler.id },
    });
    await prisma.document.deleteMany({
      where: { travelerId: traveler.id },
    });
    await prisma.travelRecord.deleteMany({
      where: { travelerId: traveler.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Travel wallet cleared successfully. Ready for fresh document scanning.',
    });
  } catch (err: any) {
    console.error('Error clearing travel wallet:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to clear travel wallet' },
      { status: 500 }
    );
  }
}
