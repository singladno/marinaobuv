import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function POST(request: NextRequest) {
  try {
    let slugs: string[] = [];

    try {
      const body = await request.json();
      slugs = body.slugs || [];
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json({ products: [] });
    }

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        slug: {
          in: slugs,
        },
        isActive: true,
        batchProcessingStatus: 'completed',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          where: {
            isActive: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
          select: {
            url: true,
            color: true,
            isPrimary: true,
          },
        },
      },
    });

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => {
      const primaryImageUrl = product.images[0]?.url || null;
      const seen = new Set<string>();
      const colorOptions = product.images
        .filter(img => !!img.color)
        .filter(img => {
          const key = (img.color || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(img => ({ color: img.color as string, imageUrl: img.url }));

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        pricePair: product.pricePair,
        article: product.article,
        images: product.images.map(img => ({
          url: img.url,
          alt: img.color || undefined,
        })),
        category: product.category,
        sizes: product.sizes,
        primaryImageUrl,
        colorOptions,
      };
    });

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error('Error fetching basket products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch basket products' },
      { status: 500 }
    );
  }
}
