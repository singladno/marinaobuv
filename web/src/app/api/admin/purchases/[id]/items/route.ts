import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { formatPurchaseDescription } from '@/utils/purchaseDescriptionFormatter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { productId, color } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Требуется ID товара' },
        { status: 400 }
      );
    }

    // Await params before using
    const { id } = await params;

    // Verify purchase exists and belongs to user
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Закупка не найдена' },
        { status: 404 }
      );
    }

    // Check if exact product/color is already in this purchase
    const existingItem = await prisma.purchaseItem.findFirst({
      where: {
        purchaseId: id,
        productId,
        color: color ?? null,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Этот цвет товара уже в закупке' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Get the next sort index
    const lastItem = await prisma.purchaseItem.findFirst({
      where: { purchaseId: id },
      orderBy: { sortIndex: 'desc' },
    });

    const nextSortIndex = (lastItem?.sortIndex || 0) + 1;

    // Calculate old price (price + 80%)
    const oldPrice = Number(product.pricePair) * 1.8;

    // Format description according to template
    const formattedDescription = formatPurchaseDescription({
      description: product.description,
      material: product.material,
      sizes: product.sizes,
      pricePair: product.pricePair.toNumber(),
    });

    // Create purchase item
    const purchaseItem = await prisma.purchaseItem.create({
      data: {
        purchaseId: id,
        productId,
        color: color ?? null,
        name: product.name,
        description: formattedDescription,
        price: product.pricePair,
        oldPrice,
        sortIndex: nextSortIndex,
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
            },
          },
        },
      },
    });

    return NextResponse.json(purchaseItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item to purchase:', error);
    return NextResponse.json(
      { error: 'Failed to add item to purchase' },
      { status: 500 }
    );
  }
}
