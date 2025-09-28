// This file contains utility functions for draft image processing
// Currently unused but kept for future functionality

export interface ImageData {
  url: string;
  s3Key: string;
  mime: string;
  sha256: string;
  width?: number;
  height?: number;
}

/**
 * Process images from messages and upload to S3
 */
export async function processImagesFromMessages(
  messages: Array<{
    id: string;
    type: string | null;
    mediaUrl: string | null;
    mediaS3Key: string | null;
    mediaMime: string | null;
    mediaSha256: string | null;
  }>
): Promise<ImageData[]> {
  const imageData: ImageData[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.type !== 'image' || !message.mediaUrl) continue;

    console.log(
      `Processing image ${i + 1}/${messages.length} for message ${message.id}...`
    );

    try {
      // If already uploaded to S3, use existing data
      if (message.mediaS3Key && message.mediaMime && message.mediaSha256) {
        console.log(`  ✓ Image already uploaded to S3: ${message.mediaS3Key}`);
        imageData.push({
          url: message.mediaUrl,
          s3Key: message.mediaS3Key,
          mime: message.mediaMime,
          sha256: message.mediaSha256,
        });
        continue;
      }

      // Skip S3 upload for testing - use original WhatsApp URLs
      console.log(
        `  ⚡ Using original WhatsApp URL (skipping S3 upload for testing)`
      );
      imageData.push({
        url: message.mediaUrl,
        s3Key: `original-${message.id}`, // Use message ID as key for reference
        mime: 'image/jpeg', // Assume JPEG for now
        sha256: '', // Skip SHA256 calculation for testing
      });
    } catch (error) {
      console.error(
        `  ❌ Failed to process image for message ${message.id}:`,
        error
      );
    }
  }

  return imageData;
}
