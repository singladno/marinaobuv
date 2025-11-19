import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
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

    // Validate sizes structure - size can be text (e.g., "35/36"), count must be a number
    for (const size of sizes) {
      if (!size.size || typeof size.size !== 'string' || size.size.trim() === '') {
        return NextResponse.json(
          { error: 'Каждый размер должен иметь текстовое значение размера (например: "36" или "35/36")' },
          { status: 400 }
        );
      }
      if (typeof size.count !== 'number' || size.count < 0) {
        return NextResponse.json(
          { error: 'Каждый размер должен иметь количество (число >= 0)' },
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
