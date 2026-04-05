import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

/**
 * Single request to persist many sortIndex updates (avoids N PUTs on load/reorder).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const items = body?.items as
      | Array<{ id: string; sortIndex: number }>
      | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array of { id, sortIndex }' },
        { status: 400 }
      );
    }

    for (const row of items) {
      if (
        typeof row?.id !== 'string' ||
        typeof row?.sortIndex !== 'number' ||
        !Number.isFinite(row.sortIndex)
      ) {
        return NextResponse.json(
          { error: 'Each item must have id (string) and sortIndex (number)' },
          { status: 400 }
        );
      }
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      select: { id: true },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const itemIds = new Set(items.map(i => i.id));

    const existing = await prisma.purchaseItem.findMany({
      where: {
        purchaseId: id,
        id: { in: [...itemIds] },
      },
      select: { id: true },
    });

    if (existing.length !== itemIds.size) {
      return NextResponse.json(
        { error: 'One or more items do not belong to this purchase' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map(row =>
        prisma.purchaseItem.update({
          where: { id: row.id },
          data: { sortIndex: row.sortIndex },
        })
      )
    );

    return NextResponse.json({ ok: true, updated: items.length });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/purchases/[id]/items/reorder',
      error,
      'Error reordering purchase items:'
    );
    return NextResponse.json(
      { error: 'Failed to reorder purchase items' },
      { status: 500 }
    );
  }
}
