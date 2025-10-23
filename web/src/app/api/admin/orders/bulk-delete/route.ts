import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
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
      message: `Successfully deleted ${result.count} order${result.count === 1 ? '' : 's'}`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('Bulk delete orders error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
