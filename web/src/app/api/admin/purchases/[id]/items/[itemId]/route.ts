import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, price, sortIndex } = await request.json();

    // Await params before using
    const { id, itemId } = await params;

    // Verify purchase exists and belongs to user
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Update purchase item
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      updateData.price = price;
      updateData.oldPrice = price * 1.8; // Recalculate old price
    }
    if (sortIndex !== undefined) updateData.sortIndex = sortIndex;

    const purchaseItem = await prisma.purchaseItem.update({
      where: { id: itemId },
      data: updateData,
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

    return NextResponse.json(purchaseItem);
  } catch (error) {
    console.error('Error updating purchase item:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before using
    const { id, itemId } = await params;

    // Verify purchase exists and belongs to user
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Delete purchase item
    await prisma.purchaseItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting purchase item:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase item' },
      { status: 500 }
    );
  }
}
