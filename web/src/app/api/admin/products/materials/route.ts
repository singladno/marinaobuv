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

    // Get distinct material values from products
    const products = await prisma.product.findMany({
      where: {
        material: {
          not: null,
        },
        ...(query
          ? {
              material: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      select: {
        material: true,
      },
      distinct: ['material'],
      take: 20,
      orderBy: {
        material: 'asc',
      },
    });

    const materials = products
      .map(p => p.material)
      .filter((m): m is string => m !== null && m.trim() !== '');

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}
