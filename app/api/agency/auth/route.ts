import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.AGENCY_PASSWORD?.trim() || 'visa-vault-agent';

    if (password === expectedPassword) {
      const response = NextResponse.json({ success: true, authorized: true });
      response.cookies.set('agency_session', 'authenticated', {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid agency access password' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
