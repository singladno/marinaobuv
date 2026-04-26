import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { getOrderDataVersion } from '@/lib/server/order-data-version';
import { prisma } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TICK_MS = 2500;
const KEEPALIVE_MS = 20000;

/**
 * SSE: when server-side data for this order changes, client refetches GET /api/admin/orders/[id].
 * No event on connect (avoids duplicate refetch with initial load). `: ping` keepalive for proxies.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, 'ADMIN');
  if (auth.error) {
    return auth.error;
  }

  const { id: orderId } = await params;

  const exists = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!exists) {
    return new Response(JSON.stringify({ error: 'Заказ не найден' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let lastVersion = await getOrderDataVersion(orderId);
  if (lastVersion === null) {
    return new Response(JSON.stringify({ error: 'Заказ не найден' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (version: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ version })}\n\n`)
        );
      };

      const tick = async () => {
        try {
          const next = await getOrderDataVersion(orderId);
          if (next === null) {
            return;
          }
          if (next !== lastVersion) {
            lastVersion = next;
            send(next);
          }
        } catch {
          /* ignore */
        }
      };

      const tickId = setInterval(tick, TICK_MS);
      const keepAliveId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* ignore */
        }
      }, KEEPALIVE_MS);

      request.signal.addEventListener('abort', () => {
        clearInterval(tickId);
        clearInterval(keepAliveId);
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
