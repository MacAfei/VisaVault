import { randomUUID } from 'node:crypto';
import { get, put } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function isPrivateBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith('.private.blob.vercel-storage.com') &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

function safeFileName(fileName: string): string {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
}

export async function storeDocumentFile(
  fileName: string,
  contentType: string,
  buffer: Buffer
): Promise<string> {
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum permitted limit of 10 MB');
  }

  const name = safeFileName(fileName);

  if (process.env.NODE_ENV === 'development') {
    const storedName = `${Date.now()}_${randomUUID()}_${name}`;
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, storedName), buffer);
    return `/api/uploads/${storedName}`;
  }

  const blob = await put(`documents/${randomUUID()}-${name}`, buffer, {
    access: 'private',
    addRandomSuffix: true,
    contentType,
  });

  return blob.url;
}

export async function readPrivateBlob(value: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  if (!isPrivateBlobUrl(value)) {
    throw new Error('Invalid private document URL');
  }

  const blob = await get(value, { access: 'private' });
  if (!blob?.stream || blob.statusCode !== 200) {
    throw new Error('Document file was not found');
  }

  const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer());
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum permitted limit of 10 MB');
  }

  return {
    buffer,
    contentType: blob.blob.contentType || 'application/octet-stream',
  };
}