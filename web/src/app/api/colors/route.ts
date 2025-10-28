import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Build where clause for products
    const productWhere: any = {
      isActive: true,
      batchProcessingStatus: 'completed',
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
    const colors = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
        },
        product: productWhere,
      },
      select: {
        color: true,
      },
      distinct: ['color'],
    });

    // Extract unique colors and filter out null values
    const uniqueColors = colors
      .map(c => c.color)
      .filter((color): color is string => color !== null)
      .sort();

    return NextResponse.json({ colors: uniqueColors });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении цветов' },
      { status: 500 }
    );
  }
}
