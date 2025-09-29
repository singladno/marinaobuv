import { prisma } from './db-node';
import { uploadImageToS3 } from './draft-image-uploader';

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
 * Process a single draft image for approval
 */
export async function processSingleDraftImage(
  draftImage: {
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
  },
  index: number,
  total: number
): Promise<ApprovalImageData | null> {
  // Skip inactive images
  if (!draftImage.isActive) {
    console.log(`  ⏭️  Skipping inactive image ${index + 1}/${total}: ${draftImage.id}`);
    return null;
  }

  console.log(`\n  📸 Processing image ${index + 1}/${total}: ${draftImage.id}`);
  console.log(`     URL: ${draftImage.url}`);
  console.log(`     Current key: ${draftImage.key || 'None'}`);
  console.log(`     Is Primary: ${draftImage.isPrimary}`);
  console.log(`     Color: ${draftImage.color || 'None'}`);

  try {
    // Check if image is already in our Yandex S3 (not wasabi or WhatsApp)
    if (draftImage.key && draftImage.url.includes('storage.yandexcloud.net')) {
      console.log(`  ✅ Image already in our Yandex S3: ${draftImage.key}`);
      console.log(`     Skipping upload - already processed`);
      return {
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
      };
    }

    // Upload image to S3
    const uploadResult = await uploadImageToS3(draftImage.url, draftImage.id);

    if (uploadResult.success && uploadResult.url && uploadResult.key) {
      return {
        id: draftImage.id,
        url: uploadResult.url,
        key: uploadResult.key,
        alt: draftImage.alt,
        sort: draftImage.sort,
        isPrimary: draftImage.isPrimary,
        isActive: draftImage.isActive,
        color: draftImage.color,
        width: draftImage.width,
        height: draftImage.height,
      };
    }

    return null;
  } catch (error) {
    console.error(`  ❌ Error processing image ${draftImage.id}:`, error);
    return null;
  }
}

/**
 * Process draft images and upload them to S3 during approval
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

  console.log(`\n📸 Processing ${draftImages.length} draft images for approval...`);
  console.log(`   Active images: ${draftImages.filter(img => img.isActive).length}`);
  console.log(`   Inactive images: ${draftImages.filter(img => !img.isActive).length}`);

  for (let i = 0; i < draftImages.length; i++) {
    const result = await processSingleDraftImage(draftImages[i], i, draftImages.length);
    if (result) {
      processedImages.push(result);
    }
  }

  console.log(`\n✅ Image processing complete!`);
  console.log(`   Total processed: ${processedImages.length} images`);
  console.log(`   Successfully uploaded: ${processedImages.length} images`);
  console.log(
    `   Failed uploads: ${draftImages.filter(img => img.isActive).length - processedImages.length} images`
  );

  if (processedImages.length > 0) {
    console.log(`\n   New S3 URLs:`);
    processedImages.forEach((img, index) => {
      console.log(`     ${index + 1}. ${img.url}`);
    });
  }

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
