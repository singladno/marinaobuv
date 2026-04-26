import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';
import { emailService } from '@/lib/server/email';
import { logRequestError } from '@/lib/server/request-logging';
import { logger } from '@/lib/server/logger';
import { logOrderActivity } from '@/lib/server/order-activity';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'ADMIN');
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get search query from URL params
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('search')?.trim() || '';

    // Build where clause for search
    const whereClause: any = {};
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      whereClause.OR = [
        // Search by order number
        { orderNumber: { contains: searchLower, mode: 'insensitive' } },
        // Search by order ID (last 8 characters) - case sensitive for CUID
        { id: { endsWith: searchQuery } },
        // Search by phone (order phone)
        { phone: { contains: searchLower, mode: 'insensitive' } },
        // Search by user name
        { user: { name: { contains: searchLower, mode: 'insensitive' } } },
        // Search by user email
        { user: { email: { contains: searchLower, mode: 'insensitive' } } },
        // Search by user phone
        { user: { phone: { contains: searchLower, mode: 'insensitive' } } },
      ];
    }

    // Only include line items whose Product row still exists (orphan rows have no FK target).
    // Do not use productId: { in: [...all ids] } — PostgreSQL caps bind parameters (~32767) and prod has more products.
    const [orders, gruzchiks] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            where: {
              product: {
                is: { id: { not: { equals: '' } } },
              },
            },
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
          user: {
            select: {
              id: true,
              phone: true,
              name: true,
              email: true,
              label: true,
            },
          },
          gruzchik: { select: { id: true, name: true } },
          transportOptions: {
            where: { isSelected: true },
            select: {
              id: true,
              transportId: true,
              transportName: true,
            },
          },
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
    const message = e instanceof Error ? e.message : 'Неожиданная ошибка';
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
      return NextResponse.json({ error: 'Требуется ID' }, { status: 400 });

    // Get the order to find the user and current status
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        userId: true,
        orderNumber: true,
        status: true,
        gruzchikId: true,
        payment: true,
        user: {
          select: { email: true, name: true },
        },
        gruzchik: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
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

    const actorId = authResult.user.id as string;
    if (typeof status === 'string' && status !== order.status) {
      await logOrderActivity({
        orderId: id,
        kind: 'order_status_changed',
        title: `Статус заказа изменён на «${status}»`,
        details: { previous: order.status },
        actorType: 'ADMIN',
        actorUserId: actorId,
      });
    }
    if (gruzchikId !== undefined) {
      const nextGruzchikId = gruzchikId === '' ? null : gruzchikId;
      if (nextGruzchikId !== order.gruzchikId) {
        const newG = nextGruzchikId
          ? await prisma.user.findUnique({
              where: { id: nextGruzchikId },
              select: { name: true },
            })
          : null;
        await logOrderActivity({
          orderId: id,
          kind: 'order_gruzchik_changed',
          title: nextGruzchikId
            ? `Назначен грузчик: ${newG?.name ?? '—'}`
            : 'Грузчик снят с заказа',
          details: { gruzchikId: nextGruzchikId },
          actorType: 'ADMIN',
          actorUserId: actorId,
        });
      }
    }
    if (payment !== undefined && payment !== null) {
      const newPayment = Number(payment) || 0;
      const prevPayment = Number(order.payment);
      if (newPayment !== prevPayment) {
        await logOrderActivity({
          orderId: id,
          kind: 'order_payment_changed',
          title: `Сумма оплаты изменена: ${newPayment.toLocaleString('ru-RU')} ₽`,
          details: { previous: prevPayment },
          actorType: 'ADMIN',
          actorUserId: actorId,
        });
      }
    }

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
        logger.debug(
          `✅ Email notification sent for order ${order.orderNumber} status change to ${status}`
        );
      } catch (error) {
        logRequestError(
          req,
          '/api/admin/orders',
          error,
          `❌ Failed to send email notification for order ${order.orderNumber}:`
        );
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Неожиданная ошибка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
