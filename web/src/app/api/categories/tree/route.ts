import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET() {
  try {
    // Fetch ALL active categories once (unlimited depth) and build the tree manually
    // Try to include icon field, but handle case where it might not exist yet
    let categories;
    try {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          path: true,
          parentId: true,
          icon: true,
        },
      });
    } catch (error: any) {
      // If icon field doesn't exist yet, fetch without it
      if (error?.message?.includes('icon') || error?.message?.includes('Unknown field')) {
        categories = await prisma.category.findMany({
          where: { isActive: true },
          orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            path: true,
            parentId: true,
          },
        });
        // Add null icon to all categories
        categories = categories.map((cat: any) => ({ ...cat, icon: null }));
      } else {
        throw error;
      }
    }

    // Compute leaf product counts by category
    const grouped = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true },
    });
    const leafCountByCategory = new Map<string, number>(
      grouped.map(g => [
        g.categoryId as string,
        (g as any)._count._all as number,
      ])
    );

    type Node = {
      id: string;
      name: string;
      slug: string;
      path: string;
      icon: string | null;
      children: Node[];
    };

    // Build lookup by parentId
    const childrenByParent = new Map<
      string | null,
      Array<(typeof categories)[number]>
    >();
    for (const c of categories) {
      const key = (c.parentId as string | null) ?? null;
      const arr = childrenByParent.get(key) ?? [];
      arr.push(c);
      childrenByParent.set(key, arr);
    }

    const toNode = (c: (typeof categories)[number]): Node => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      path: c.path,
      icon: (c as any).icon ?? null,
      children: (childrenByParent.get(c.id) ?? []).map(toNode),
    });

    const roots = (childrenByParent.get(null) ?? []).map(toNode);

    // Roll up counts and filter empty branches
    const computeTotalAndFilter = (
      node: Node
    ): { node: Node | null; total: number } => {
      const own = leafCountByCategory.get(node.id) || 0;
      const processedChildren = node.children.map(computeTotalAndFilter);
      const childrenKept = processedChildren
        .filter(c => (c?.node ?? null) !== null)
        .map(c => c.node as Node);
      const total =
        own + processedChildren.reduce((acc, c) => acc + c.total, 0);
      if (total === 0) return { node: null, total };
      return { node: { ...node, children: childrenKept }, total };
    };

    let items = roots
      .map(computeTotalAndFilter)
      .filter(r => r.node !== null)
      .map(r => r.node as Node);

    // Fallback: if all filtered out by counts, return full tree
    if (items.length === 0) items = roots;

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
