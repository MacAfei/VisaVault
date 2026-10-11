import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = path.basename(filename);
    const filePath = path.join(process.cwd(), 'data', 'uploads', safeName);

    const data = await fs.readFile(filePath);

    let contentType = 'application/octet-stream';
    if (safeName.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (safeName.endsWith('.png')) contentType = 'image/png';
    else if (safeName.endsWith('.jpg') || safeName.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (safeName.endsWith('.pdf')) contentType = 'application/pdf';

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
