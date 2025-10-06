import { NextResponse, type NextRequest } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

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
    await prisma.productImage.delete({ where: { id: imageId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete product image', error);
    return NextResponse.json(
      { error: 'Failed to delete product image' },
      { status: 500 }
    );
  }
}
