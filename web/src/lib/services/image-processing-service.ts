import { putFromUrl, buildKey } from '../s3u';

export interface ImageData {
  url: string;
  key: string;
  mimeType: string;
  width?: number;
  height?: number;
  color?: string | null;
}

/**
 * Service for processing images from WhatsApp messages
 */
export class ImageProcessingService {
  /**
   * Process images from messages and upload to S3
   */
  async processImagesFromMessages(
    messages: any[],
    imageColors?: Array<{ url: string; color: string | null }>
  ): Promise<ImageData[]> {
    const imageData: ImageData[] = [];

    for (const message of messages) {
      if (
        (message.type === 'image' || message.type === 'imageMessage') &&
        message.mediaUrl
      ) {
        try {
          console.log(`     📸 Processing image from message ${message.id}...`);

          // Upload to S3
          const extension = message.mediaMimeType
            ? message.mediaMimeType.split('/')[1] || 'jpg'
            : 'jpg';
          const s3Key = `draft-images/${buildKey(extension)}`;
          const result = await putFromUrl(
            s3Key,
            message.mediaUrl,
            message.mediaMimeType
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to upload to S3');
          }

          // Find the color for this image URL
          const imageColor = imageColors?.find(
            ic => ic.url === message.mediaUrl
          );

          imageData.push({
            url: result.url || message.mediaUrl,
            key: s3Key,
            mimeType: message.mediaMimeType || 'image/jpeg',
            width: message.mediaWidth,
            height: message.mediaHeight,
            color: imageColor?.color || null,
          });
        } catch (error) {
          console.error(
            `Error processing image from message ${message.id}:`,
            error
          );
        }
      }
    }

    return imageData;
  }
}
