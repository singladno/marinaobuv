import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true, // Only show active products
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
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
          take: 1,
          select: {
            url: true,
          },
        },
      },
    });

    // Transform the data to include primaryImageUrl
    const transformedProducts = products.map(product => ({
      ...product,
      primaryImageUrl: product.images[0]?.url || null,
    }));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
