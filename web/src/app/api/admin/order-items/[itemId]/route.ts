import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';

async function recalcOrderTotals(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { priceBox: true, qty: true },
  });
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.priceBox) * item.qty,
    0
  );
  await prisma.order.update({
    where: { id: orderId },
    data: { subtotal, total: subtotal },
  });
  return { subtotal, total: subtotal };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;
    const body = await request.json().catch(() => ({}));
    const qty = body.qty;

    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
      return NextResponse.json(
        { error: 'Требуется целое количество не меньше 1' },
        { status: 400 }
      );
    }

    const orderItem = await prisma.orderItem.findFirst({
      where: { id: itemId },
      select: { id: true, orderId: true },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Позиция заказа не найдена' },
        { status: 404 }
      );
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: { qty },
    });

    const orderTotals = await recalcOrderTotals(orderItem.orderId);

    return NextResponse.json({
      success: true,
      item: { id: itemId, qty },
      order: orderTotals,
    });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/order-items/[itemId]',
      error,
      'Failed to update order item qty:'
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
      },
      include: {
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Delete the order item (cascade will handle related data)
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate order totals
    const remainingItems = await prisma.orderItem.findMany({
      where: {
        orderId: orderItem.order.id,
      },
    });

    const subtotal = remainingItems.reduce(
      (sum, item) => sum + Number(item.priceBox) * item.qty,
      0
    );

    // Update order totals
    await prisma.order.update({
      where: { id: orderItem.order.id },
      data: {
        subtotal,
        total: subtotal,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order item deleted successfully',
    });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/order-items/[itemId]',
      error,
      'Failed to delete order item:'
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
