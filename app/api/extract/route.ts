import { NextRequest, NextResponse } from 'next/server';
import { extractDocumentData } from '@/lib/extract/gemini';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const requestedDocType = (formData.get('docType') as string) || 'PASSPORT';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds maximum permitted limit of 10 MB' },
          { status: 413 }
        );
      }

      const mimeType = file.type || 'image/jpeg';
      const fileName = file.name || 'uploaded_document';

      // Save file locally to /data/uploads/
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeName);
      await fs.writeFile(filePath, buffer);

      const base64Data = buffer.toString('base64');
      const fileUrl = `/api/uploads/${safeName}`;

      const result = await extractDocumentData({
        fileName,
        docType: requestedDocType,
        mimeType,
        base64Data,
      });

      return NextResponse.json({
        ...result,
        fileUrl,
        fileName,
      });
    }

    // Handle JSON payload (e.g. sample document selection or raw base64)
    const body = await req.json();
    const { fileName = 'sample_document', docType = 'PASSPORT', sampleUrl, base64Data, mimeType = 'image/svg+xml' } = body;

    let payloadBase64 = base64Data;
    let fileUrl = sampleUrl || `/samples/${fileName}`;

    if (sampleUrl && !payloadBase64) {
      try {
        const publicPath = path.join(process.cwd(), 'public', sampleUrl.replace(/^\//, ''));
        const fileBytes = await fs.readFile(publicPath);
        payloadBase64 = fileBytes.toString('base64');
      } catch {
        // Mock fallback will handle it
      }
    }

    const result = await extractDocumentData({
      fileName,
      docType,
      mimeType,
      base64Data: payloadBase64,
    });

    return NextResponse.json({
      ...result,
      fileUrl,
      fileName,
    });
  } catch (err: any) {
    console.error('API /extract error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error during document extraction' },
      { status: 500 }
    );
  }
}
