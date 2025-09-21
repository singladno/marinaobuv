import { prisma } from './db-node';
import { putFromUrl, getExtensionFromMime } from './s3u';

export interface ApprovalImageData {
  id: string;
  url: string;
  key: string;
  alt: string | null;
  sort: number;
  isPrimary: boolean;
  isActive: boolean;
  color: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Process draft images and upload them to S3 during approval
 * This ensures all images are in S3 before the draft is approved
 */
export async function processDraftImagesForApproval(
  draftImages: Array<{
    id: string;
    url: string;
    key: string | null;
    alt: string | null;
    sort: number;
    isPrimary: boolean;
    isActive: boolean;
    color: string | null;
    width: number | null;
    height: number | null;
  }>
): Promise<ApprovalImageData[]> {
  const processedImages: ApprovalImageData[] = [];

  console.log(`Processing ${draftImages.length} draft images for approval...`);

  for (let i = 0; i < draftImages.length; i++) {
    const draftImage = draftImages[i];

    // Skip inactive images
    if (!draftImage.isActive) {
      console.log(
        `  ⏭️  Skipping inactive image ${i + 1}/${draftImages.length}: ${draftImage.id}`
      );
      continue;
    }

    console.log(
      `  📸 Processing image ${i + 1}/${draftImages.length}: ${draftImage.id}`
    );

    try {
      // Check if image is already in S3 (not a WhatsApp URL)
      if (
        draftImage.key &&
        !draftImage.url.includes('whatsapp') &&
        !draftImage.url.includes('wa.me')
      ) {
        console.log(`  ✓ Image already in S3: ${draftImage.key}`);
        processedImages.push({
          id: draftImage.id,
          url: draftImage.url,
          key: draftImage.key,
          alt: draftImage.alt,
          sort: draftImage.sort,
          isPrimary: draftImage.isPrimary,
          isActive: draftImage.isActive,
          color: draftImage.color,
          width: draftImage.width,
          height: draftImage.height,
        });
        continue;
      }

      // Upload WhatsApp image to S3
      console.log(`  ⬆️  Uploading WhatsApp image to S3: ${draftImage.url}`);

      // Generate S3 key for draft images with better naming
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2);
      const ext = getExtensionFromMime('image/jpeg'); // Default to jpg for WhatsApp images
      const s3Key = `draft-products/${timestamp}-${random}.${ext}`;

      // Upload image from WhatsApp URL to S3
      const uploadResult = await putFromUrl(
        s3Key,
        draftImage.url,
        'image/jpeg'
      );

      if (uploadResult.success && uploadResult.url) {
        console.log(`  ✅ Image uploaded successfully: ${uploadResult.url}`);
        processedImages.push({
          id: draftImage.id,
          url: uploadResult.url,
          key: s3Key,
          alt: draftImage.alt,
          sort: draftImage.sort,
          isPrimary: draftImage.isPrimary,
          isActive: draftImage.isActive,
          color: draftImage.color,
          width: draftImage.width,
          height: draftImage.height,
        });
      } else {
        console.error(
          `  ❌ Failed to upload image ${draftImage.id}:`,
          uploadResult.error
        );
        // Continue processing other images even if one fails
      }
    } catch (error) {
      console.error(`  ❌ Error processing image ${draftImage.id}:`, error);
      // Continue processing other images even if one fails
    }
  }

  console.log(`✅ Processed ${processedImages.length} images for approval`);
  return processedImages;
}

/**
 * Process a single draft product's images during approval
 */
export async function processDraftImagesForApprovalById(
  draftId: string
): Promise<ApprovalImageData[]> {
  // Get draft product with images
  const draft = await prisma.waDraftProduct.findUnique({
    where: { id: draftId },
    include: { images: true },
  });

  if (!draft) {
    throw new Error(`Draft product not found: ${draftId}`);
  }

  return await processDraftImagesForApproval(draft.images);
}

/**
 * Update draft images with S3 URLs after upload
 */
export async function updateDraftImagesWithS3Urls(
  processedImages: ApprovalImageData[]
): Promise<void> {
  for (const image of processedImages) {
    await prisma.waDraftProductImage.update({
      where: { id: image.id },
      data: {
        url: image.url,
        key: image.key,
      },
    });
  }
}
