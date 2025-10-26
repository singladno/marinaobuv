import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before using
    const { id } = await params;

    // Get purchase with items
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { sortIndex: 'asc' },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    if (purchase.items.length === 0) {
      return NextResponse.json(
        { error: 'Purchase has no items' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Calculate totals
    const subtotal = purchase.items.reduce(
      (sum: number, item: any) => sum + Number(item.price),
      0
    );
    const total = subtotal; // No additional fees for now

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        fullName: session.user.name || 'Admin',
        phone: (session.user as any).phone || '',
        email: session.user.email || '',
        address: 'Закупка',
        subtotal,
        total,
        status: 'Новый',
        comment: `Создано из закупки: ${purchase.name}`,
        items: {
          create: purchase.items.map((item: any) => ({
            productId: item.productId,
            slug: item.product.slug,
            name: item.name,
            article: item.product.article,
            priceBox: item.price,
            qty: 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order from purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create order from purchase' },
      { status: 500 }
    );
  }
}
