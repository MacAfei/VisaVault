import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));

      // Fetch current cases count and send
      try {
        const count = await prisma.case.count();
        controller.enqueue(
          encoder.encode(`event: update\ndata: ${JSON.stringify({ caseCount: count, timestamp: Date.now() })}\n\n`)
        );
      } catch {
        // Ignore db disconnects in closed stream
      }

      // Close cleanly
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
