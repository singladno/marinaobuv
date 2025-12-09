import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true, // Only show active products
        OR: [
          { batchProcessingStatus: 'completed' }, // Parsed products
          { source: 'MANUAL' }, // Manually created products
        ],
      },
      take: 50, // Show more products
      orderBy: { createdAt: 'desc' },
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
        videos: {
          where: {
            isActive: true,
          },
          orderBy: { sort: 'asc' },
          select: {
            id: true,
            url: true,
            alt: true,
            sort: true,
          },
        },
      },
    });

    // Transform the data to include primaryImageUrl
    const transformedProducts = products.map((product: any) => {
      const primaryImageUrl = product.images?.[0]?.url || null;
      const seen = new Set<string>();
      const colorOptions = (product.images || [])
        .filter((img: any) => !!img.color)
        .filter((img: any) => {
          const key = (img.color || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((img: any) => ({ color: img.color as string, imageUrl: img.url }));

      return {
        ...product,
        primaryImageUrl,
        colorOptions,
      };
    });

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
