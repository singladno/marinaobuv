import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth-helpers';
import { logRequestError } from '@/lib/server/request-logging';

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
    logRequestError(req, '/api/admin/products/materials', error, 'Error fetching materials:');
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}
