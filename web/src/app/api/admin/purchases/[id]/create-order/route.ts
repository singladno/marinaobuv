import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { generateOrderNumber } from '@/lib/order-number-generator';
import { generateItemCode } from '@/lib/itemCodeGenerator';

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
    const orderNumber = await generateOrderNumber();

    // Calculate box price using the same logic as general order creation
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
      // This correctly handles cases where one size has multiple pairs (count > 1)
      const totalPairs = sizesArray.reduce((sum: number, size: any) => {
        if (!size || typeof size !== 'object') {
          return sum;
        }

        // Try different possible field names for count
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

    const subtotal = purchase.items.reduce((sum: number, item: any) => {
      const boxPrice = getBoxPriceFromPair(
        item.product?.pricePair,
        item.product?.sizes
      );
      return sum + boxPrice;
    }, 0);
    const total = subtotal; // No additional fees for now

    // Generate item codes for all items
    const itemCodes = await Promise.all(
      purchase.items.map(() => generateItemCode())
    );

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
          create: purchase.items.map((item: any, index: number) => ({
            productId: item.productId,
            slug: item.product.slug,
            name: item.name,
            article: item.product.article,
            priceBox: getBoxPriceFromPair(
              item.product?.pricePair,
              item.product?.sizes
            ),
            qty: 1,
            itemCode: itemCodes[index],
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
