import { prisma } from '@/lib/server/db';

import {
  createProductData,
  generateUniqueSlug,
  processDraftImages,
  processDraftSizes,
} from './utils';

interface DraftProduct {
  id: string;
  name: string;
  pricePair?: number;
  currency?: string;
  material?: string;
  gender?: string;
  season?: string;
  description?: string;
  categoryId?: string;
  images?: Array<{
    isActive?: boolean;
    isPrimary?: boolean;
    sort?: number;
    url: string;
    key: string;
    alt?: string;
    color?: string;
    width?: number;
    height?: number;
  }>;
  sizes?: Array<{
    size?: string;
    name?: string;
    stock?: number;
    count?: number;
    perBox?: number;
  }>;
}

export async function convertDraftToProduct(draft: DraftProduct) {
  console.log(
    `Processing draft ${draft.id} (${draft.name}) for catalog conversion...`
  );

  // Process images
  const processedImages = processDraftImages(draft.images || []);
  console.log(
    `  📸 Using ${processedImages.length} existing images for draft ${draft.id} (no upload)`
  );

  if (processedImages.length === 0) {
    console.log(
      `  ⚠️  No active images found for draft ${draft.id}, skipping...`
    );
    throw new Error('No active images found');
  }

  // Process sizes
  const processedSizes = processDraftSizes(draft.sizes || []);
  if (draft.sizes && Array.isArray(draft.sizes)) {
    console.log(
      `  📏 Processing ${draft.sizes.length} sizes for draft ${draft.id}...`
    );
  } else {
    console.log(`  📏 No sizes data found for draft ${draft.id}`);
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(draft.name, draft.id);

  // Create product data
  const productData = createProductData(
    draft,
    slug,
    processedImages,
    processedSizes
  );

  // Create Product record and update draft status
  const product = await prisma.$transaction(async tx => {
    const created = await tx.product.create({ data: productData as any });

    // Update draft: mark processed and hide from active lists
    await tx.waDraftProduct.update({
      where: { id: draft.id },
      data: { status: 'processed', isDeleted: true },
    });

    return created;
  });

  console.log(
    `  ✅ Successfully converted draft ${draft.id} to product ${product.id} with ${processedImages.length} images`
  );

  return product;
}
