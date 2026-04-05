import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import {
  prismaProductSelectForPurchaseDetailList,
  prismaProductSelectForPurchaseDetailListLite,
} from '@/lib/server/admin-purchase-selects';
import { logRequestError } from '@/lib/server/request-logging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before using
    const { id } = await params;
    const lite = request.nextUrl.searchParams.get('lite') === '1';

    const itemSelectShared = {
      id: true,
      name: true,
      price: true,
      oldPrice: true,
      sortIndex: true,
      color: true,
      productId: true,
      product: {
        select: lite
          ? prismaProductSelectForPurchaseDetailListLite
          : prismaProductSelectForPurchaseDetailList,
      },
    };

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        items: {
          orderBy: { sortIndex: 'asc' },
          select: lite
            ? itemSelectShared
            : { ...itemSelectShared, description: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/purchases/[id]',
      error,
      'Error fetching purchase:'
    );
    return NextResponse.json(
      { error: 'Failed to fetch purchase' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before using
    const { id } = await params;

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    await prisma.purchase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logRequestError(
      request,
      '/api/admin/purchases/[id]',
      error,
      'Error deleting purchase:'
    );
    return NextResponse.json(
      { error: 'Failed to delete purchase' },
      { status: 500 }
    );
  }
}
