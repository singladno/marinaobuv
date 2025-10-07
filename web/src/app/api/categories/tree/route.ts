import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

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
              select: { id: true, name: true, slug: true, path: true },
            },
          },
        },
      },
    });

    // Get counts of active products per category
    const grouped = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true },
    });
    const countByCategory = new Map<string, number>(
      grouped.map(g => [g.categoryId, (g as any)._count._all as number])
    );

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

    const computeTotalAndFilter = (
      node: Node
    ): { node: Node | null; total: number } => {
      const own = countByCategory.get(node.id) || 0;
      const processedChildren = node.children.map(computeTotalAndFilter);
      const childrenKept = processedChildren
        .filter(c => (c?.node ?? null) !== null)
        .map(c => c.node as Node);
      const total =
        own + processedChildren.reduce((acc, c) => acc + c.total, 0);
      if (total === 0) return { node: null, total };
      return { node: { ...node, children: childrenKept }, total };
    };

    const items = roots
      .map(transform)
      .map(computeTotalAndFilter)
      .filter(r => r.node !== null)
      .map(r => r.node as Node);

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Categories tree API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch categories tree',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
