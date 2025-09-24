import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/db';
import { slugify } from '@/utils/slugify';
import { processDraftProductImages } from '@/lib/draft-to-product-image-processor';

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
        console.log(
          `Processing draft ${d.id} (${d.name}) for catalog conversion...`
        );

        // Process images and upload to S3
        console.log(
          `  📸 Processing ${d.images.length} images for draft ${d.id}...`
        );
        const processedImages = await processDraftProductImages(d.id);

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
          const created = await tx.product.create({
            data: {
              slug,
              name: d.name,
              categoryId: d.categoryId,
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
                  alt: img.alt,
                  sort: img.sort,
                  isPrimary: img.isPrimary,
                  color: img.color,
                  width: img.width,
                  height: img.height,
                })),
              },
              sizes: {
                create:
                  d.sizes && Array.isArray(d.sizes)
                    ? d.sizes.map((size: any) => ({
                        size: size.size || size.name || 'Unknown',
                        perBox: size.count || size.perBox || null,
                        stock: size.stock || null,
                        sku: size.sku || null,
                      }))
                    : [],
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
