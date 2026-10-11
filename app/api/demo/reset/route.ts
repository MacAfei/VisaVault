import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Run seed via tsx
    await execAsync('npx tsx prisma/seed.ts');

    return NextResponse.json({
      success: true,
      message: 'Demo database successfully reset to pristine seed state with all 3 demo moments and 5 agency cases.',
    });
  } catch (err: any) {
    console.error('API /demo/reset error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reset demo database' },
      { status: 500 }
    );
  }
}
