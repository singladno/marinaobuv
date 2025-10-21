import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        path: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { ok: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, ...category });
  } catch (error) {
    console.error('Category API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
