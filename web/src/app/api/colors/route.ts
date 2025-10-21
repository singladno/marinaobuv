import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Get all unique colors from product images
    const colors = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
        },
        product: {
          isActive: true,
          batchProcessingStatus: 'completed',
        },
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
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}
