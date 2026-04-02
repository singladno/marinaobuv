import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  request: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true, // Only show active products
        OR: [
          { batchProcessingStatus: 'completed' }, // Only show fully processed products
          { source: 'MANUAL' }, // Manually created products
          { source: 'AG' }, // Products from aggregator
        ],
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
    logRequestError(request, '/api/products/by-slug/[slug]', error, 'Error fetching product:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
