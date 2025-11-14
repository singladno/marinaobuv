import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true, // Only show active products
        batchProcessingStatus: 'completed', // Only show fully processed products
      },
      include: {
        images: {
          where: {
            isActive: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
        },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
