import { NextRequest, NextResponse } from 'next/server';

import {
  buildOrderUpdateData,
  validateGruzchikOrderAccess,
} from '@/lib/gruzchik/orderValidation';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'GRUZCHIK');
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const { id, label, payment, status } = body as {
      id: string;
      label?: string | null;
      payment?: number | null;
      status?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify the order belongs to this грузчик
    const validation = await validateGruzchikOrderAccess(id, auth.user.id);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 404 });
    }

    // Build update data
    const { hasUpdates, updateData } = buildOrderUpdateData({
      label,
      payment,
      status,
    });

    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                article: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
