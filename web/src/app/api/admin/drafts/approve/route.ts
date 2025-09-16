import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { requireRole } from '@/lib/auth';
import { slugify } from '@/utils/slugify';
import type { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ['ADMIN' as Role]);
    const body = await req.json();
    const { ids, categoryId } = body as { ids: string[]; categoryId: string };
    if (!Array.isArray(ids) || !ids.length || !categoryId) {
      return NextResponse.json(
        { error: 'ids and categoryId are required' },
        { status: 400 }
      );
    }

    const drafts = await prisma.waDraftProduct.findMany({
      where: { id: { in: ids } },
      include: { images: true },
    });

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const d of drafts) {
      try {
        const baseSlug = slugify(`${d.name}-${d.id.slice(0, 6)}`);
        let slug = baseSlug;
        for (let i = 1; i < 50; i++) {
          const exists = await prisma.product.findUnique({ where: { slug } });
          if (!exists) break;
          slug = `${baseSlug}-${i}`;
        }

        const product = await prisma.$transaction(async tx => {
          const created = await tx.product.create({
            data: {
              slug,
              name: d.name,
              categoryId,
              pricePair: d.pricePair ?? 0,
              currency: d.currency ?? 'RUB',
              packPairs: d.packPairs ?? null,
              priceBox: d.priceBox ?? null,
              material: d.material ?? null,
              gender: d.gender ?? null,
              season: d.season ?? null,
              description: d.description ?? null,
              images: {
                create: d.images
                  .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                  .map(img => ({
                    url: img.url,
                    alt: img.alt ?? null,
                    sort: img.sort ?? 0,
                    isPrimary: !!img.isPrimary,
                  })),
              },
            },
          });

          await tx.waDraftProduct.update({
            where: { id: d.id },
            data: { status: 'approved' },
          });
          return created;
        });

        results.push({ draftId: d.id, productId: product.id });
      } catch (err: any) {
        results.push({
          draftId: d.id,
          error: err?.message ?? 'Failed to approve',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status }
    );
  }
}
