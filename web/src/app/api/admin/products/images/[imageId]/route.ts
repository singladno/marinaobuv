import { NextResponse, type NextRequest } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { normalizeToStandardColor } from '@/lib/constants/colors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageId } = await params;
  const updateData = await request.json();

  try {
    // Only allow updating specific fields
    const allowedFields: any = {};
    if ('isActive' in updateData) {
      allowedFields.isActive = updateData.isActive;
    }
    if ('isPrimary' in updateData) {
      allowedFields.isPrimary = updateData.isPrimary;
    }
    if ('sort' in updateData) {
      allowedFields.sort = updateData.sort;
    }
    if ('color' in updateData) {
      // Normalize color to standard color
      allowedFields.color = updateData.color
        ? normalizeToStandardColor(updateData.color)
        : null;
    }

    // If isPrimary is being set to true, unset it for all other images of the same product
    if (allowedFields.isPrimary === true) {
      const image = await prisma.productImage.findUnique({
        where: { id: imageId },
        select: { productId: true },
      });

      if (image) {
        // Unset isPrimary for all other images of this product
        await prisma.productImage.updateMany({
          where: {
            productId: image.productId,
            id: { not: imageId },
          },
          data: { isPrimary: false },
        });
      }
    }

    const updated = await prisma.productImage.update({
      where: { id: imageId },
      data: allowedFields,
    });
    return NextResponse.json({ image: updated });
  } catch (error) {
    console.error('Failed to update product image', error);
    return NextResponse.json(
      { error: 'Failed to update product image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageId } = await params;

  try {
    // Soft delete by setting isActive to false
    await prisma.productImage.update({
      where: { id: imageId },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete product image', error);
    return NextResponse.json(
      { error: 'Failed to delete product image' },
      { status: 500 }
    );
  }
}
