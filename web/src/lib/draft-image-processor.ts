import { prisma } from './db-node';
import { fetchMediaBuffer } from './whapi';
import {
  putBuffer,
  buildKey,
  getExtensionFromMime,
  computeSha256,
} from './s3u';
import { env } from './env';

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

      // Upload to S3 if not already done
      if (env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
        console.log(`  📤 Fetching image from WhatsApp...`);
        const { buf, mime, ext } = await fetchMediaBuffer({
          url: message.mediaUrl,
          id: message.id,
          token: env.WHAPI_TOKEN,
        });

        const key = buildKey(ext);
        console.log(`  📤 Uploading to S3: ${key}`);
        const uploadResult = await putBuffer(key, buf, mime);

        if (uploadResult.success) {
          const sha256 = computeSha256(buf);
          console.log(`  ✓ Image uploaded successfully: ${key}`);
          imageData.push({
            url: uploadResult.url || message.mediaUrl,
            s3Key: key,
            mime,
            sha256,
          });
        } else {
          console.log(`  ❌ Failed to upload image: ${uploadResult.error}`);
        }
      } else {
        console.log(`  ⚠️ S3 credentials not configured, skipping upload`);
      }
    } catch (error) {
      console.error(
        `  ❌ Failed to process image for message ${message.id}:`,
        error
      );
    }
  }

  return imageData;
}
