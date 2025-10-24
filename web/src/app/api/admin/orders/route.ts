import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';
import { emailService } from '@/lib/server/email';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'ADMIN');
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const [orders, gruzchiks] = await Promise.all([
      prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  article: true,
                  pricePair: true,
                },
              },
            },
          },
          user: { select: { id: true, phone: true, name: true, label: true } },
          gruzchik: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.user.findMany({
        where: { role: 'GRUZCHIK' },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Calculate unread message count for each order
    const ordersWithUnreadCount = await Promise.all(
      orders.map(async order => {
        let totalUnreadCount = 0;
        for (const item of order.items) {
          // Get total messages for this order item (excluding messages sent by the admin)
          const totalMessages = await prisma.orderItemMessage.count({
            where: {
              orderItemId: item.id,
              userId: {
                not: authResult.user.id, // Exclude messages sent by the admin themselves
              },
            },
          });

          // Get messages read by admin (excluding messages sent by the admin)
          const readMessages = await prisma.orderItemMessageRead.count({
            where: {
              message: {
                orderItemId: item.id,
                userId: {
                  not: authResult.user.id, // Exclude messages sent by the admin themselves
                },
              },
              userId: authResult.user.id,
            },
          });

          const unreadCount = Math.max(0, totalMessages - readMessages);
          totalUnreadCount += unreadCount;
        }

        return {
          ...order,
          unreadMessageCount: totalUnreadCount,
        };
      })
    );

    return NextResponse.json({ orders: ordersWithUnreadCount, gruzchiks });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'ADMIN');
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const { id, status, gruzchikId, label, payment } = body as {
      id: string;
      status?: string;
      gruzchikId?: string | null;
      label?: string | null;
      payment?: number | null;
    };

    if (!id)
      return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Get the order to find the user and current status
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        userId: true,
        orderNumber: true,
        status: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate availability when status is set to "Согласование"
    if (status === 'Согласование') {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
        select: { id: true, name: true, isAvailable: true },
      });

      const itemsWithoutAvailability = orderItems.filter(
        item => item.isAvailable === null || item.isAvailable === undefined
      );

      if (itemsWithoutAvailability.length > 0) {
        const itemNames = itemsWithoutAvailability
          .map(item => item.name)
          .join(', ');
        return NextResponse.json(
          {
            error: `Нельзя изменить статус на "Согласование". Для следующих товаров не указана доступность: ${itemNames}`,
          },
          { status: 400 }
        );
      }
    }

    const data: {
      status?: string;
      payment?: number;
      gruzchikId?: string | null;
    } = {};
    if (typeof status === 'string') data.status = status;
    if (payment !== undefined && payment !== null)
      data.payment = Number(payment) || 0;
    if (gruzchikId !== undefined) {
      data.gruzchikId = gruzchikId === '' ? null : gruzchikId;
    }

    // Update the order
    const updated = await prisma.order.update({ where: { id }, data });

    // If label is provided and order has a user, update the user's label
    if (label !== undefined && order.userId) {
      await prisma.user.update({
        where: { id: order.userId },
        data: { label: label || null },
      });
    }

    // Send email notification if status changed to "Согласование" and user has email
    if (status === 'Согласование' && order.user?.email) {
      try {
        await emailService.sendOrderStatusChangeEmail(
          order.user.email,
          order.orderNumber,
          status
        );
        console.log(
          `✅ Email notification sent for order ${order.orderNumber} status change to ${status}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send email notification for order ${order.orderNumber}:`,
          error
        );
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
