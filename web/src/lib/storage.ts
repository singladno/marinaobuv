import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

// Load environment variables
config();

// Yandex Cloud Object Storage implementation using S3-compatible API
const requiredEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
};

// Initialize S3 client for Yandex Cloud
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net',
  region: process.env.S3_REGION || 'ru-central1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

// Real S3 upload implementation for Yandex Cloud
async function uploadToYandex(
  key: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<boolean> {
  try {
    const bucket = requiredEnv('S3_BUCKET');

    console.log(
      '📤 Uploading to S3:',
      `https://storage.yandexcloud.net/${bucket}/${key}`
    );
    console.log('Image size:', imageBuffer.length, 'bytes');
    console.log('Content type:', contentType);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make the object publicly readable
    });

    await s3Client.send(command);
    console.log('✅ Upload completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Upload error:', error);
    return false;
  }
}

export function getObjectKey(opts: { productId: string; ext: string }): string {
  const { productId, ext } = opts;
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const rand = Math.random().toString(36).slice(2);
  return `products/${productId}/${Date.now()}-${rand}.${safeExt}`;
}

export function getPublicUrl(key: string): string {
  const cdn = process.env.CDN_BASE_URL;
  if (cdn && cdn.trim().length > 0) {
    // CDN_BASE_URL already includes the full URL, just append the key
    return `${cdn}/${key}`;
  }
  const bucket = requiredEnv('S3_BUCKET');
  return `https://storage.yandexcloud.net/${bucket}/${key}`;
}

// For Yandex Cloud, we'll use direct upload instead of presigned URLs
export async function presignPut(
  key: string,
  contentType: string,
  expiresSec = 600
): Promise<string> {
  // Return a placeholder URL - the actual upload will be handled by the uploadImage function
  const bucket = requiredEnv('S3_BUCKET');
  return `https://storage.yandexcloud.net/${bucket}/${key}`;
}

// Direct upload function for Yandex Cloud
export async function uploadImage(
  key: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<boolean> {
  return await uploadToYandex(key, imageBuffer, contentType);
}
