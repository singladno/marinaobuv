import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { getInboxEventVersion } from '@/lib/wa-admin-inbox';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE: notifies when inbox message set changes (new row). Client refetches chats/messages.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  const encoder = new TextEncoder();
  let lastVersion = await getInboxEventVersion();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (version: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ version })}\n\n`)
        );
      };

      send(lastVersion);

      const tick = async () => {
        try {
          const next = await getInboxEventVersion();
          if (next !== lastVersion) {
            lastVersion = next;
            send(next);
          }
        } catch {
          /* ignore */
        }
      };

      const id = setInterval(tick, 2500);

      request.signal.addEventListener('abort', () => {
        clearInterval(id);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
