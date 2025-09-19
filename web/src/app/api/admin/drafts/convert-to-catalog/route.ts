import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { slugify } from '@/utils/slugify';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Get approved drafts with their images
    const drafts = await prisma.waDraftProduct.findMany({
      where: {
        id: { in: ids },
        status: 'approved', // Only convert approved drafts
      },
      include: { images: true },
    });

    if (drafts.length === 0) {
      return NextResponse.json(
        { error: 'No approved drafts found' },
        { status: 404 }
      );
    }

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const d of drafts) {
      try {
        // Create unique slug
        const baseSlug = slugify(`${d.name}-${d.id.slice(0, 6)}`);
        let slug = baseSlug;
        for (let i = 1; i < 50; i++) {
          const exists = await prisma.product.findUnique({ where: { slug } });
          if (!exists) break;
          slug = `${baseSlug}-${i}`;
        }

        // Create Product record and update draft status
        const product = await prisma.$transaction(async tx => {
          const created = await tx.product.create({
            data: {
              slug,
              name: d.name,
              categoryId: d.categoryId,
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
                  .filter(img => img.isActive) // Only include active images
                  .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                  .map(img => ({
                    url: img.url,
                    key: img.key,
                    alt: img.alt ?? null,
                    sort: img.sort ?? 0,
                    isPrimary: !!img.isPrimary,
                    color: img.color ?? null,
                    width: img.width ?? null,
                    height: img.height ?? null,
                  })),
              },
            },
          });

          // Update draft status to 'processed'
          await tx.waDraftProduct.update({
            where: { id: d.id },
            data: { status: 'processed' },
          });

          return created;
        });

        results.push({ draftId: d.id, productId: product.id });
      } catch (err: any) {
        results.push({
          draftId: d.id,
          error: err?.message ?? 'Failed to convert to catalog',
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;

    return NextResponse.json({
      success: true,
      message: `Converted ${successCount} out of ${drafts.length} drafts to catalog`,
      results,
      count: successCount,
    });
  } catch (e: any) {
    console.error('Error converting drafts to catalog:', e);
    return NextResponse.json(
      { error: 'Failed to convert drafts to catalog' },
      { status: 500 }
    );
  }
}
