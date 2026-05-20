import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';
import { formatBulkOrdersDeletedMessage } from '@/utils/orderNumberUtils';
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const { orderIds } = body as { orderIds: string[] };

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    // Delete orders and their related data (cascade will handle order items)
    const result = await prisma.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: formatBulkOrdersDeletedMessage(result.count),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    logRequestError(
      req,
      '/api/admin/orders/bulk-delete',
      message,
      'Bulk delete orders error:'
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
