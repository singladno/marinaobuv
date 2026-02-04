import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { generateItemCode } from '@/lib/itemCodeGenerator';

function getBoxPriceFromPair(pricePair: any, sizes: any): number {
  const price = Number(pricePair) || 0;
  if (!sizes) {
    return price; // Default to 1 pair if no sizes
  }

  // Handle JSON string if needed
  let sizesArray: any[] = [];
  if (typeof sizes === 'string') {
    try {
      sizesArray = JSON.parse(sizes);
    } catch {
      return price; // If parsing fails, default to 1 pair
    }
  } else if (Array.isArray(sizes)) {
    sizesArray = sizes;
  } else {
    return price; // If not array or string, default to 1 pair
  }

  // Sum up the count from all sizes to get total pairs
  const totalPairs = sizesArray.reduce((sum: number, size: any) => {
    if (!size || typeof size !== 'object') {
      return sum;
    }

    const count =
      (typeof size.count === 'number' ? size.count : 0) ||
      (typeof size.quantity === 'number' ? size.quantity : 0) ||
      (typeof size.stock === 'number' ? size.stock : 0) ||
      (typeof size.qty === 'number' ? size.qty : 0) ||
      0;

    return sum + Number(count);
  }, 0);

  // If no pairs found, default to 1
  const pairs = totalPairs > 0 ? totalPairs : 1;
  return price * pairs;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    const { productId, qty = 1, color = null } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Требуется ID товара' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, total: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        article: true,
        pricePair: true,
        sizes: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Calculate box price
    const boxPrice = getBoxPriceFromPair(product.pricePair, product.sizes);
    const itemTotal = boxPrice * qty;

    // Generate item code
    const itemCode = await generateItemCode();

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        article: product.article,
        priceBox: boxPrice,
        qty,
        color: color ?? null,
        itemCode,
      },
      include: {
        product: {
          include: {
            images: {
              select: {
                id: true,
                url: true,
                alt: true,
                color: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
                phone: true,
                place: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Update order total
    const newTotal = Number(order.total) + itemTotal;
    await prisma.order.update({
      where: { id },
      data: { total: newTotal },
    });

    return NextResponse.json(orderItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item to order:', error);
    return NextResponse.json(
      { error: 'Не удалось добавить товар в заказ' },
      { status: 500 }
    );
  }
}
