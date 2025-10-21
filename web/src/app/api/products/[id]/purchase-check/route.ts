import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    // Check if user has purchased this product
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: session.userId,
        status: {
          in: ['completed', 'delivered', 'shipped'], // Only count completed orders
        },
        items: {
          some: {
            productId: productId,
          },
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      hasPurchased: !!hasPurchased,
      orderId: hasPurchased?.id,
      orderStatus: hasPurchased?.status,
      purchaseDate: hasPurchased?.createdAt,
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    );
  }
}
