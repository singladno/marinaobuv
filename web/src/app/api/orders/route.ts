import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';
import { generateOrderNumber } from '@/lib/order-number-generator';

interface CreateOrderItem {
  slug: string;
  qty: number;
}

function getBoxPriceFromPair(pricePair: any, sizes: any[]): number {
  const pairs = Array.isArray(sizes)
    ? sizes.reduce((sum, s) => sum + Number(s?.stock ?? 0), 0)
    : 0;
  return Number(pricePair) * (pairs > 0 ? pairs : 1);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  select: {
                    id: true,
                    url: true,
                    alt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const {
      items,
      phone,
      email,
      fullName,
      address,
      transportId,
      transportName,
    } = body as {
      items: CreateOrderItem[];
      phone: string;
      email?: string;
      fullName?: string;
      address?: string;
      transportId?: string | null;
      transportName?: string | null;
    };

    if (!items || !Array.isArray(items) || items.length === 0)
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    if (!phone)
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });

    // Fetch products by slugs
    const slugs = items.map(i => i.slug).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs } },
      include: { sizes: true },
    });

    if (products.length === 0)
      return NextResponse.json(
        { error: 'Products not found' },
        { status: 400 }
      );

    // Build order items and totals
    const orderItemsData = items
      .map(i => {
        const p = products.find(pp => pp.slug === i.slug);
        if (!p) return null;
        const priceBox = getBoxPriceFromPair(p.pricePair, p.sizes as any[]);
        return {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          article: p.article ?? null,
          priceBox,
          qty: Math.max(1, Number(i.qty) || 1),
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      slug: string;
      name: string;
      article: string | null;
      priceBox: number;
      qty: number;
    }>;

    if (orderItemsData.length === 0)
      return NextResponse.json(
        { error: 'No valid order items' },
        { status: 400 }
      );

    const subtotal = orderItemsData.reduce(
      (sum, it) => sum + Number(it.priceBox) * it.qty,
      0
    );
    const total = subtotal;

    // Generate human-readable order number
    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.userId ?? null,
        phone,
        email: email ?? null,
        fullName: fullName ?? null,
        address: address ?? null,
        transportId: transportId ?? null,
        transportName: transportName ?? null,
        subtotal,
        total,
        items: {
          createMany: {
            data: orderItemsData.map(oi => ({
              productId: oi.productId,
              slug: oi.slug,
              name: oi.name,
              article: oi.article,
              priceBox: oi.priceBox,
              qty: oi.qty,
            })),
          },
        },
      },
      select: { id: true, orderNumber: true },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
