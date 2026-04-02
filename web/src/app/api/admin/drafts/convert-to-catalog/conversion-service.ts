import { prisma } from '@/lib/server/db';
import { logger } from '@/lib/server/logger';

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
  logger.debug(
    `Processing draft ${draft.id} (${draft.name}) for catalog conversion...`
  );

  // Get the full draft with source message IDs and provider info
  const fullDraft = await prisma.waDraftProduct.findUnique({
    where: { id: draft.id },
    select: {
      id: true,
      name: true,
      source: true,
      providerId: true,
    },
  });

  if (!fullDraft) {
    throw new Error(`Draft ${draft.id} not found`);
  }

  // Extract source message IDs from the draft
  const sourceMessageIds =
    fullDraft.source && Array.isArray(fullDraft.source)
      ? (fullDraft.source as string[])
      : [];

  logger.debug(
    `  📱 Found ${sourceMessageIds.length} source message IDs for draft ${draft.id}`
  );

  // Process images
  const processedImages = processDraftImages(draft.images || []);
  logger.debug(
    `  📸 Using ${processedImages.length} existing images for draft ${draft.id} (no upload)`
  );

  if (processedImages.length === 0) {
    logger.debug(
      `  ⚠️  No active images found for draft ${draft.id}, skipping...`
    );
    throw new Error('No active images found');
  }

  // Process sizes
  const processedSizes = processDraftSizes(draft.sizes || []);
  if (draft.sizes && Array.isArray(draft.sizes)) {
    logger.debug(
      `  📏 Processing ${draft.sizes.length} sizes for draft ${draft.id}...`
    );
  } else {
    logger.debug(`  📏 No sizes data found for draft ${draft.id}`);
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(draft.name, draft.id);

  // Create product data with source message IDs and provider
  const productData = createProductData(
    draft,
    slug,
    processedImages,
    processedSizes,
    sourceMessageIds,
    fullDraft.providerId
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

  logger.debug(
    `  ✅ Successfully converted draft ${draft.id} to product ${product.id} with ${processedImages.length} images and ${sourceMessageIds.length} source messages`
  );

  return product;
}
