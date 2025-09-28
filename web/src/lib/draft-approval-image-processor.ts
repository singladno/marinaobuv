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
  }>,
  // draftId?: string
): Promise<ApprovalImageData[]> {
  const processedImages: ApprovalImageData[] = [];

  console.log(
    `\n📸 Processing ${draftImages.length} draft images for approval...`
  );
  console.log(
    `   Active images: ${draftImages.filter(img => img.isActive).length}`
  );
  console.log(
    `   Inactive images: ${draftImages.filter(img => !img.isActive).length}`
  );

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
      `\n  📸 Processing image ${i + 1}/${draftImages.length}: ${draftImage.id}`
    );
    console.log(`     URL: ${draftImage.url}`);
    console.log(`     Current key: ${draftImage.key || 'None'}`);
    console.log(`     Is Primary: ${draftImage.isPrimary}`);
    console.log(`     Color: ${draftImage.color || 'None'}`);

    try {
      // Check if image is already in our Yandex S3 (not wasabi or WhatsApp)
      if (
        draftImage.key &&
        draftImage.url.includes('storage.yandexcloud.net')
      ) {
        console.log(`  ✅ Image already in our Yandex S3: ${draftImage.key}`);
        console.log(`     Skipping upload - already processed`);
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

      // Determine source type
      let sourceType = 'Unknown';
      if (
        draftImage.url.includes('whatsapp') ||
        draftImage.url.includes('wa.me')
      ) {
        sourceType = 'WhatsApp';
      } else if (draftImage.url.includes('wasabisys.com')) {
        sourceType = 'Wasabi S3';
      } else if (draftImage.url.includes('s3.')) {
        sourceType = 'Other S3';
      }

      // Upload image to our Yandex S3 (from wasabi or WhatsApp)
      console.log(`  ⬆️  Uploading ${sourceType} image to our Yandex S3...`);
      console.log(`     Source: ${draftImage.url}`);

      // Generate S3 key for draft images with better naming
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2);
      const ext = getExtensionFromMime('image/jpeg'); // Default to jpg for WhatsApp images
      const s3Key = `draft-products/${timestamp}-${random}.${ext}`;

      // Upload image from source URL to our Yandex S3
      console.log(`     Target S3 Key: ${s3Key}`);
      const uploadResult = await putFromUrl(
        s3Key,
        draftImage.url,
        'image/jpeg'
      );

      if (uploadResult.success && uploadResult.url) {
        console.log(
          `  ✅ Successfully uploaded ${sourceType} image to Yandex S3!`
        );
        console.log(`     New S3 URL: ${uploadResult.url}`);

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
          `  ❌ Failed to upload ${sourceType} image ${draftImage.id}:`,
          uploadResult.error
        );
        console.error(`     Source URL: ${draftImage.url}`);
        console.error(`     Target S3 Key: ${s3Key}`);

        // Continue processing other images even if one fails
      }
    } catch (error) {
      console.error(`  ❌ Error processing image ${draftImage.id}:`, error);
      // Continue processing other images even if one fails
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

  return await processDraftImagesForApproval(draft.images, draftId);
}

/**
 * Update draft images with S3 URLs after upload
 */
export async function updateDraftImagesWithS3Urls(
  processedImages: ApprovalImageData[]
): Promise<void> {
  console.log(`\n🔄 Updating database with new S3 URLs...`);

  for (let i = 0; i < processedImages.length; i++) {
    const image = processedImages[i];
    console.log(
      `  ${i + 1}/${processedImages.length} Updating image ${image.id}...`
    );
    console.log(`     Old URL: [will be replaced]`);
    console.log(`     New URL: ${image.url}`);
    console.log(`     New Key: ${image.key}`);

    await prisma.waDraftProductImage.update({
      where: { id: image.id },
      data: {
        url: image.url,
        key: image.key,
      },
    });

    console.log(`     ✅ Database updated successfully`);
  }

  console.log(`\n✅ All ${processedImages.length} images updated in database!`);
}
