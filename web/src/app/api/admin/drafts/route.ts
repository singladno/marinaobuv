import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireRole } from '@/lib/auth';
import type { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') || '50', 10), 100);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const status = searchParams.get('status') || undefined;

    const drafts = await prisma.waDraftProduct.findMany({
      take,
      skip,
      where: { status: status as string | undefined },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        messageId: true,
        providerId: true,
        provider: { select: { id: true, name: true, phone: true } },
        name: true,
        article: true,
        pricePair: true,
        currency: true,
        packPairs: true,
        priceBox: true,
        material: true,
        gender: true,
        season: true,
        description: true,
        sizes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: { id: true, url: true, isPrimary: true, sort: true },
        },
      },
    });

    return NextResponse.json({ drafts });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const body = await req.json();
    // body: { id: string, data: Partial<WaDraftProduct> }
    const { id, data } = body as { id: string; data: Record<string, any> };
    if (!id || !data)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const updated = await prisma.waDraftProduct.update({
      where: { id },
      data,
    });

    return NextResponse.json({ draft: updated });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status }
    );
  }
}
