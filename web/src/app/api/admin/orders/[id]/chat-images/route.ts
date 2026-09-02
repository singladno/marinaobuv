import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';
import { listOrderChatImages } from '@/lib/server/order-item-message-attachments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { id: orderId } = await params;
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    const items = await listOrderChatImages(orderId);
    return NextResponse.json({ items });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/orders/[id]/chat-images',
      error,
      'Failed to list order chat images:'
    );
    return NextResponse.json(
      { error: 'Failed to list chat images' },
      { status: 500 }
    );
  }
}
