import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
                sizes: true,
                images: {
                  select: {
                    id: true,
                    url: true,
                    alt: true,
                  },
                  orderBy: { sort: 'asc' },
                },
              },
            },
            feedbacks: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            replacements: {
              include: {
                adminUser: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
                clientUser: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            messages: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5, // Get latest 5 messages for preview
            },
          },
        },
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            label: true,
          },
        },
        gruzchik: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
