import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

/** Id + description only — small JSON for merging after ?lite=1 purchase load. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: purchaseId } = await params;

    const purchase = await prisma.purchase.findFirst({
      where: {
        id: purchaseId,
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

    const rows = await prisma.purchaseItem.findMany({
      where: { purchaseId },
      select: {
        id: true,
        description: true,
      },
      orderBy: { sortIndex: 'asc' },
    });

    return NextResponse.json({ items: rows });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/purchases/[id]/item-descriptions',
      error,
      'Error fetching purchase item descriptions:'
    );
    return NextResponse.json(
      { error: 'Failed to fetch descriptions' },
      { status: 500 }
    );
  }
}
