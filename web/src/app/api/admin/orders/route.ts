import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
              messages: {
                where: {
                  isService: false,
                  userId: {
                    not: session.userId, // Exclude messages sent by the admin themselves
                  },
                  readBy: {
                    none: {
                      userId: session.userId,
                    },
                  },
                },
                select: {
                  id: true,
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
    const ordersWithUnreadCount = orders.map(order => ({
      ...order,
      unreadMessageCount: order.items.reduce(
        (total, item) => total + item.messages.length,
        0
      ),
    }));

    return NextResponse.json({ orders: ordersWithUnreadCount, gruzchiks });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get the order to find the user
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
