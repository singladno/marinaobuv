import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { sizes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(sizes)) {
      return NextResponse.json(
        { error: 'Sizes must be an array' },
        { status: 400 }
      );
    }

    // Validate sizes structure
    for (const size of sizes) {
      if (!size.size || typeof size.count !== 'number') {
        return NextResponse.json(
          { error: 'Each size must have a size string and count number' },
          { status: 400 }
        );
      }
    }

    // Update product sizes (now stored as JSON array of objects)
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        sizes: sizes, // Store as JSON array of size objects
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product sizes:', error);
    return NextResponse.json(
      { error: 'Failed to update product sizes' },
      { status: 500 }
    );
  }
}
