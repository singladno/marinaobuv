import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { getOrderActivityTimeline } from '@/lib/server/order-activity';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) return auth.error;

    const { id: orderId } = await params;
    const timeline = await getOrderActivityTimeline(orderId);
    if (timeline === null) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    return NextResponse.json({ events: timeline });
  } catch (e) {
    logRequestError(
      request,
      '/api/admin/orders/[id]/activity',
      e,
      'order activity failed:'
    );
    return NextResponse.json(
      { error: 'Не удалось загрузить историю' },
      { status: 500 }
    );
  }
}
