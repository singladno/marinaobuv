import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/db';
import { logRequestError } from '@/lib/server/request-logging';

const CACHE_TAG = 'admin-purchases';
const CACHE_REVALIDATE_SEC = 20;

async function getPurchasesForUser(userId: string) {
  return prisma.purchase.findMany({
    where: { createdById: userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              pricePair: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { id: true, url: true, alt: true },
              },
            },
          },
        },
        orderBy: { sortIndex: 'asc' },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const purchases = await unstable_cache(
      () => getPurchasesForUser(session.user!.id),
      [CACHE_TAG, session.user.id],
      { revalidate: CACHE_REVALIDATE_SEC, tags: [CACHE_TAG, `admin-purchases-${session.user.id}`] }
    )();

    return NextResponse.json(purchases);
  } catch (error) {
    logRequestError(request, '/api/admin/purchases', error, 'Error fetching purchases:');
    return NextResponse.json(
      { error: 'Ошибка при получении закупок' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Требуется название' },
        { status: 400 }
      );
    }

    const purchase = await prisma.purchase.create({
      data: {
        name: name.trim(),
        createdById: session.user.id,
      },
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
    });

    revalidateTag(`admin-purchases-${session.user.id}`);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    logRequestError(request, '/api/admin/purchases', error, 'Error creating purchase:');
    return NextResponse.json(
      { error: 'Ошибка при создании закупки' },
      { status: 500 }
    );
  }
}
