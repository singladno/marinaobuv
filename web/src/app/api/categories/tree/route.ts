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

    const items = roots.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      path: r.path,
      children: r.children.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        path: c.path,
        children: c.children.map(gc => ({
          id: gc.id,
          name: gc.name,
          slug: gc.slug,
          path: gc.path,
        })),
      })),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Categories tree API error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to fetch categories tree',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
