import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { getStandardColors, normalizeToStandardColor } from '@/lib/constants/colors';

/**
 * Convert color to title case (first letter uppercase, rest lowercase)
 */
function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Build where clause for products
    const productWhere: any = {
      isActive: true,
      OR: [
        { batchProcessingStatus: 'completed' }, // Parsed products
        { source: 'MANUAL' }, // Manually created products
        { source: 'AG' }, // Products from aggregator
      ],
    };

    // If categoryId is provided, filter products by category (including subcategories)
    if (categoryId) {
      // First, get the category and check if it has subcategories
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          children: {
            select: { id: true },
            where: { isActive: true },
          },
        },
      });

      if (category) {
        // If category has subcategories, include products from all subcategories
        if (category.children.length > 0) {
          const subcategoryIds = category.children.map(child => child.id);
          productWhere.categoryId = {
            in: [categoryId, ...subcategoryIds],
          };
        } else {
          // If no subcategories, just use the category itself
          productWhere.categoryId = categoryId;
        }
      } else {
        // Fallback to direct category if not found
        productWhere.categoryId = categoryId;
      }
    }

    // Get unique colors from product images for the specified category
    const images = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
        },
        product: productWhere,
      },
      select: {
        color: true,
      },
    });

    // Normalize all colors to standard colors and collect unique ones
    const normalizedColorsSet = new Set<string>();

    for (const image of images) {
      if (!image.color) continue;

      // Normalize to standard color
      const normalized = normalizeToStandardColor(image.color);
      if (normalized) {
        normalizedColorsSet.add(normalized);
      }
    }

    // Convert to array, sort, and format to title case for display
    const uniqueColors = Array.from(normalizedColorsSet)
      .sort()
      .map(color => toTitleCase(color));

    return NextResponse.json({ colors: uniqueColors });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении цветов' },
      { status: 500 }
    );
  }
}
