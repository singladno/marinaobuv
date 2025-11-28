import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'GRUZCHIK');
    if (auth.error) {
      return auth.error;
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Требуется ID заказа' },
        { status: 400 }
      );
    }

    // Get the order and verify it belongs to this грузчик
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        gruzchikId: auth.user.id,
        status: {
          in: ['Наличие', 'Купить'],
        },
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден или не назначен вам' },
        { status: 404 }
      );
    }

    // Check validation based on order status
    if (order.status === 'Наличие') {
      // Check if all items have availability set
      const itemsWithoutAvailability = order.items.filter(
        item => item.isAvailable === null || item.isAvailable === undefined
      );

      if (itemsWithoutAvailability.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot verify order: some items do not have availability set',
            missingItems: itemsWithoutAvailability.map(item => item.id),
          },
          { status: 400 }
        );
      }
    } else if (order.status === 'Купить') {
      // Check if all items have purchase status set
      const itemsWithoutPurchase = order.items.filter(
        item => item.isPurchased === null || item.isPurchased === undefined
      );

      if (itemsWithoutPurchase.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot verify order: some items do not have purchase status set',
            missingItems: itemsWithoutPurchase.map(item => item.id),
          },
          { status: 400 }
        );
      }
    }

    // Determine new status based on current status
    const newStatus = order.status === 'Купить' ? 'Куплен' : 'Проверено';

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                article: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Failed to verify order:', error);
    return NextResponse.json(
      { error: 'Failed to verify order' },
      { status: 500 }
    );
  }
}
