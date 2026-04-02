import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';

export async function GET() {
  try {
    const roots = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        path: true,
        children: {
          where: { isActive: true },
          orderBy: { sort: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            path: true,
            children: {
              where: { isActive: true },
              orderBy: { sort: 'asc' },
              select: {
                id: true,
                name: true,
                slug: true,
                path: true,
                children: {
                  where: { isActive: true },
                  orderBy: { sort: 'asc' },
                  select: { id: true, name: true, slug: true, path: true },
                },
              },
            },
          },
        },
      },
    });

    type Node = {
      id: string;
      name: string;
      slug: string;
      path: string;
      children: Node[];
    };

    const transform = (n: any): Node => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      path: n.path,
      children: (n.children || []).map(transform),
    });

    const items = roots.map(transform);

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    logger.error(
      { err: error, route: '/api/categories/all' },
      'All categories API error:'
    );
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch all categories',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
