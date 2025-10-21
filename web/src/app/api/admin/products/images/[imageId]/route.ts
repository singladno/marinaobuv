import { NextResponse, type NextRequest } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

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
  const { isActive } = await request.json();

  try {
    await prisma.productImage.update({
      where: { id: imageId },
      data: { isActive },
    });
    return NextResponse.json({ ok: true });
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
