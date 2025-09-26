import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { slugify } from '@/utils/slugify';
// Note: We now reuse existing S3 images from draft records directly

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Get drafts with their images (allow any status)
    const drafts = await prisma.waDraftProduct.findMany({
      where: {
        id: { in: ids },
        // status filter removed: we allow converting any status
      },
      include: { images: true },
    });

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'No drafts found' }, { status: 404 });
    }

    const results: { draftId: string; productId?: string; error?: string }[] =
      [];

    for (const d of drafts) {
      try {
        console.log(
          `Processing draft ${d.id} (${d.name}) for catalog conversion...`
        );

        // Reuse existing S3 images from draft (no re-upload)
        const processedImages = (d.images || [])
          .filter(img => img.isActive !== false)
          .sort(
            (a, b) =>
              Number(b.isPrimary) - Number(a.isPrimary) ||
              (a.sort ?? 0) - (b.sort ?? 0)
          );

        console.log(
          `  📸 Using ${processedImages.length} existing images for draft ${d.id} (no upload)`
        );

        if (processedImages.length === 0) {
          console.log(
            `  ⚠️  No active images found for draft ${d.id}, skipping...`
          );
          results.push({
            draftId: d.id,
            error: 'No active images found',
          });
          continue;
        }

        // Log sizes information
        if (d.sizes && Array.isArray(d.sizes)) {
          console.log(
            `  📏 Processing ${d.sizes.length} sizes for draft ${d.id}...`
          );
        } else {
          console.log(`  📏 No sizes data found for draft ${d.id}`);
        }

        // Create unique slug
        const baseSlug = slugify(`${d.name}-${d.id.slice(0, 6)}`);
        let slug = baseSlug;
        for (let i = 1; i < 50; i++) {
          const exists = await prisma.product.findUnique({ where: { slug } });
          if (!exists) break;
          slug = `${baseSlug}-${i}`;
        }

        // Normalize prices: ensure pricePair and priceBox are correctly populated
        const draftPricePair = d.pricePair != null ? Number(d.pricePair) : null;
        const draftPriceBox = d.priceBox != null ? Number(d.priceBox) : null;
        const pairsPerBox = d.packPairs != null ? Number(d.packPairs) : null;

        let pricePairFinal: number | null = draftPricePair;
        let priceBoxFinal: number | null = draftPriceBox;

        if (
          pricePairFinal == null &&
          priceBoxFinal != null &&
          pairsPerBox &&
          pairsPerBox > 0
        ) {
          pricePairFinal = Math.round(priceBoxFinal / pairsPerBox);
        }
        if (
          priceBoxFinal == null &&
          pricePairFinal != null &&
          pairsPerBox &&
          pairsPerBox > 0
        ) {
          priceBoxFinal = pricePairFinal * pairsPerBox;
        }

        // Create Product record and update draft status
        const product = await prisma.$transaction(async tx => {
          const baseData: any = {
            slug,
            name: d.name || 'Без названия',
            pricePair: pricePairFinal ?? 0,
            currency: d.currency ?? 'RUB',
            packPairs: d.packPairs ?? null,
            priceBox: priceBoxFinal ?? null,
            material: d.material ?? null,
            gender: d.gender ?? null,
            season: d.season ?? null,
            description: d.description ?? null,
            images: {
              create: processedImages.map(img => ({
                url: img.url,
                key: img.key,
                alt: (img as any).alt ?? null,
                sort: img.sort ?? 0,
                isPrimary: Boolean(img.isPrimary),
                color: img.color ?? null,
                width: (img as any).width ?? null,
                height: (img as any).height ?? null,
              })),
            },
            sizes: {
              create:
                d.sizes && Array.isArray(d.sizes)
                  ? d.sizes.map((size: any) => ({
                      size: size.size || size.name || 'Unknown',
                      perBox: size.perBox || null, // perBox should be how many pairs fit in a box, not stock count
                      stock: size.count || size.stock || null, // stock count for this size
                      sku: null, // SKU not used in this system
                    }))
                  : [],
            },
          };
          if (d.categoryId) baseData.categoryId = d.categoryId;
          const created = await tx.product.create({ data: baseData });

          // Update draft: mark processed and hide from active lists
          await tx.waDraftProduct.update({
            where: { id: d.id },
            data: { status: 'processed', isDeleted: true },
          });

          return created;
        });

        console.log(
          `  ✅ Successfully converted draft ${d.id} to product ${product.id} with ${processedImages.length} images`
        );
        results.push({ draftId: d.id, productId: product.id });
      } catch (err: any) {
        console.error(`  ❌ Failed to convert draft ${d.id}:`, err);
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
