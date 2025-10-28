import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(request, 'CLIENT');
    if (auth.error) {
      return auth.error;
    }

    const { itemId } = await params;

    // Verify the order item belongs to this user and order is in approval status
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          userId: auth.user.id,
          status: 'Согласование',
        },
      },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Товар не найден или не находится в статусе согласования' },
        { status: 404 }
      );
    }

    // Mark the item as approved by adding a service message
    await prisma.orderItemMessage.create({
      data: {
        orderItemId: itemId,
        userId: auth.user.id,
        text: 'Товар одобрен клиентом',
        isService: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Товар успешно одобрен',
    });
  } catch (error) {
    console.error('Failed to approve item:', error);
    return NextResponse.json(
      { error: 'Ошибка при одобрении товара' },
      { status: 500 }
    );
  }
}
