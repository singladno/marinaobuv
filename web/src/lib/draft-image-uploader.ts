import { putFromUrl, getExtensionFromMime } from './s3u';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a single image from URL to S3
 */
export async function uploadImageToS3(
  imageUrl: string,
  imageId: string
): Promise<ImageUploadResult> {
  try {
    // Determine source type
    let sourceType = 'Unknown';
    if (imageUrl.includes('whatsapp') || imageUrl.includes('wa.me')) {
      sourceType = 'WhatsApp';
    } else if (imageUrl.includes('wasabisys.com')) {
      sourceType = 'Wasabi S3';
    } else if (imageUrl.includes('s3.')) {
      sourceType = 'Other S3';
    }

    console.log(`  ⬆️  Uploading ${sourceType} image to our Yandex S3...`);
    console.log(`     Source: ${imageUrl}`);

    // Generate S3 key for draft images with better naming
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const ext = getExtensionFromMime('image/jpeg'); // Default to jpg for WhatsApp images
    const s3Key = `draft-products/${timestamp}-${random}.${ext}`;

    // Upload image from source URL to our Yandex S3
    console.log(`     Target S3 Key: ${s3Key}`);
    const uploadResult = await putFromUrl(s3Key, imageUrl, 'image/jpeg');

    if (uploadResult.success && uploadResult.url) {
      console.log(`  ✅ Successfully uploaded ${sourceType} image to Yandex S3!`);
      console.log(`     New S3 URL: ${uploadResult.url}`);

      return {
        success: true,
        url: uploadResult.url,
        key: s3Key,
      };
    } else {
      console.error(`  ❌ Failed to upload ${sourceType} image ${imageId}:`, uploadResult.error);
      console.error(`     Source URL: ${imageUrl}`);
      console.error(`     Target S3 Key: ${s3Key}`);

      return {
        success: false,
        error: uploadResult.error || 'Upload failed',
      };
    }
  } catch (error) {
    console.error(`  ❌ Error uploading image ${imageId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
