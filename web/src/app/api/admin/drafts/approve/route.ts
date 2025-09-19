import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const body = await req.json();
    const { ids, categoryId } = body as { ids: string[]; categoryId?: string };
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'ids are required' }, { status: 400 });
    }

    // If no categoryId provided, use the first root category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const firstRootCategory = await prisma.category.findFirst({
        where: { parentId: null, isActive: true },
        orderBy: { sort: 'asc' },
        select: { id: true },
      });

      if (!firstRootCategory) {
        return NextResponse.json(
          { error: 'No root category found' },
          { status: 400 }
        );
      }

      finalCategoryId = firstRootCategory.id;
    }

    const drafts = await prisma.waDraftProduct.findMany({
      where: { id: { in: ids } },
      include: { images: true },
    });

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const d of drafts) {
      try {
        // Only update the draft status to 'approved' - don't create Product records
        await prisma.waDraftProduct.update({
          where: { id: d.id },
          data: {
            status: 'approved',
            categoryId: finalCategoryId, // Set the category for the draft
          },
        });

        results.push({ draftId: d.id });
      } catch (err: unknown) {
        results.push({
          draftId: d.id,
          error: err instanceof Error ? err.message : 'Failed to approve',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e: unknown) {
    const status = (e as any)?.status ?? 500;
    return NextResponse.json(
      { error: (e as any)?.message ?? 'Unexpected error' },
      { status }
    );
  }
}
