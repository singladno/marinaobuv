import { prisma } from './db-node';
import type { ApprovalImageData } from './draft-image-processor';

/**
 * Update draft images with S3 URLs after upload
 */
export async function updateDraftImagesWithS3Urls(
  processedImages: ApprovalImageData[]
): Promise<void> {
  console.log(`\n🔄 Updating database with new S3 URLs...`);

  for (let i = 0; i < processedImages.length; i++) {
    const image = processedImages[i];
    console.log(`  ${i + 1}/${processedImages.length} Updating image ${image.id}...`);
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
