import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/server/auth-helpers';
import { prisma } from '@/lib/server/db';

/**
 * PATCH /api/admin/products/[productId]/colors/[color]
 * Activate or deactivate all images of a specific color for a product
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; color: string }> }
) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const resolvedParams = await params;
    const productId = resolvedParams.productId;
    const encodedColor = resolvedParams.color;

    console.log('[Color Toggle API] Received params:', { productId, encodedColor });

    const { isActive } = await req.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    if (!productId || !encodedColor) {
      return NextResponse.json(
        { error: 'Product ID and color are required' },
        { status: 400 }
      );
    }

    // Decode the color parameter (Next.js should do this automatically, but let's be explicit)
    let color: string;
    try {
      color = decodeURIComponent(encodedColor);
    } catch (e) {
      // If decoding fails, use the original value
      color = encodedColor;
    }

    console.log('[Color Toggle API] Decoded color:', color);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update all images with this color (case-insensitive)
    const result = await prisma.productImage.updateMany({
      where: {
        productId,
        color: {
          equals: color,
          mode: 'insensitive',
        },
      },
      data: {
        isActive,
      },
    });

    // Check if product should be active based on active colors
    const activeImagesCount = await prisma.productImage.count({
      where: {
        productId,
        isActive: true,
      },
    });

    // If no active images remain, we might want to deactivate the product
    // But for now, we'll keep the product active and just hide inactive colors
    // The product's isActive field can remain independent

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `Updated ${result.count} image(s) for color "${color}"`,
    });
  } catch (error) {
    console.error('Error updating color activation:', error);
    return NextResponse.json(
      { error: 'Failed to update color activation' },
      { status: 500 }
    );
  }
}
