import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');

    if (auth.error) {
      return auth.error;
    }

    const { id: productId } = await params;

    // Check if user has purchased this product
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: auth.user.id,
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
    logRequestError(request, '/api/products/[id]/purchase-check', error, 'Error checking purchase:');
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    );
  }
}
