import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const purchase = await prisma.purchase.findFirst({
      where: { id, createdById: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                material: true,
                sizes: true,
                article: true,
                images: {
                  where: {
                    isActive: true,
                  },
                  orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
                  select: {
                    url: true,
                    isPrimary: true,
                    sort: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: { sortIndex: 'asc' },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Find the item with article 215126 or 918391
    const articleToFind = new URL(_request.url).searchParams.get('article') || '215126';
    const targetItem = purchase.items.find(
      item => item.product.article === articleToFind
    );

    if (!targetItem) {
      return NextResponse.json({
        message: `Item with article ${articleToFind} not found in this purchase`,
        allArticles: purchase.items.map(item => item.product.article),
      });
    }

    // Same normalization as export route - removes spaces for comparison
    const normalizeColor = (color: string | null | undefined): string => {
      if (!color) return '';
      return color.toLowerCase().trim().replace(/\s+/g, '');
    };

    const allImages = targetItem.product.images || [];
    const itemColor = targetItem.color;

    let sameColorImages: typeof allImages = [];

    if (itemColor) {
      const normalizedItemColor = normalizeColor(itemColor);
      sameColorImages = allImages.filter(img => {
        const imgColor = normalizeColor(img.color);
        return imgColor === normalizedItemColor || imgColor === '';
      });
    } else {
      sameColorImages = allImages;
    }

    const imageUrls = sameColorImages
      .map(img => img.url)
      .filter(Boolean)
      .join(',');

    return NextResponse.json({
      item: {
        id: targetItem.id,
        name: targetItem.name,
        article: targetItem.product.article,
        purchaseItemColor: targetItem.color,
        purchaseItemColorNormalized: itemColor ? normalizeColor(itemColor) : null,
        totalImages: allImages.length,
        images: allImages.map(img => ({
          url: img.url,
          color: img.color,
          colorNormalized: normalizeColor(img.color),
          isPrimary: img.isPrimary,
        })),
        filteredImagesCount: sameColorImages.length,
        filteredImages: sameColorImages.map(img => ({
          url: img.url,
          color: img.color,
          colorNormalized: normalizeColor(img.color),
        })),
        finalImageUrls: imageUrls,
        imageUrlsLength: imageUrls.length,
      },
    });
  } catch (error) {
    console.error('Error debugging export:', error);
    return NextResponse.json(
      { error: 'Failed to debug export', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
