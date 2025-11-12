import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    // Get distinct color values from product images
    const images = await prisma.productImage.findMany({
      where: {
        color: {
          not: null,
          ...(query
            ? {
                contains: query,
                mode: 'insensitive' as const,
              }
            : {}),
        },
      },
      select: {
        color: true,
      },
      distinct: ['color'],
      take: 20,
      orderBy: {
        color: 'asc',
      },
    });

    const colors = images
      .map(img => img.color)
      .filter((color): color is string => color !== null && color.trim() !== '');

    return NextResponse.json({ colors });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}

