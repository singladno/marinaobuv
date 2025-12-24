import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find products that have images with null colors
    const productsWithNullColorImages = await prisma.product.findMany({
      where: {
        images: {
          some: {
            color: null,
            isActive: true,
          },
        },
      },
      include: {
        images: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            url: true,
            color: true,
            isPrimary: true,
          },
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      take: 20, // Limit to first 20 for performance
    });

    // Count total products with null color images
    const totalCount = await prisma.product.count({
      where: {
        images: {
          some: {
            color: null,
            isActive: true,
          },
        },
      },
    });

    // Count total images with null colors
    const nullColorImagesCount = await prisma.productImage.count({
      where: {
        color: null,
        isActive: true,
      },
    });

    // Count total active images
    const totalActiveImages = await prisma.productImage.count({
      where: {
        isActive: true,
      },
    });

    // Get some sample products with their image color status
    const sampleProducts = productsWithNullColorImages.map(product => ({
      id: product.id,
      article: product.article,
      name: product.name,
      slug: product.slug,
      totalImages: product.images.length,
      imagesWithColor: product.images.filter(img => img.color !== null).length,
      imagesWithoutColor: product.images.filter(img => img.color === null).length,
      imageDetails: product.images.map(img => ({
        id: img.id,
        hasColor: img.color !== null,
        color: img.color,
        isPrimary: img.isPrimary,
      })),
    }));

    return NextResponse.json({
      summary: {
        totalProductsWithNullColorImages: totalCount,
        totalNullColorImages: nullColorImagesCount,
        totalActiveImages,
        percentageWithNullColors: totalActiveImages > 0
          ? ((nullColorImagesCount / totalActiveImages) * 100).toFixed(2) + '%'
          : '0%',
      },
      sampleProducts,
    });
  } catch (error) {
    console.error('Error verifying image colors:', error);
    return NextResponse.json(
      { error: 'Failed to verify image colors' },
      { status: 500 }
    );
  }
}
