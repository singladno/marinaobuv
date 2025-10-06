import { createHash } from 'crypto';

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { env } from './env';

// Check if we're in a build context (GitHub Actions or build process)
const isBuildContext =
  process.env.NODE_ENV === 'production' &&
  (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true');

// Type guards for required S3 environment variables - skip during build
if (!isBuildContext) {
  if (!env.S3_ENDPOINT) {
    throw new Error('S3_ENDPOINT is required');
  }
  if (!env.S3_REGION) {
    throw new Error('S3_REGION is required');
  }
  if (!env.S3_ACCESS_KEY) {
    throw new Error('S3_ACCESS_KEY is required');
  }
  if (!env.S3_SECRET_KEY) {
    throw new Error('S3_SECRET_KEY is required');
  }
}

// Initialize S3 client for Yandex Object Storage - only if not in build context
const s3Client =
  !isBuildContext &&
  env.S3_ENDPOINT &&
  env.S3_REGION &&
  env.S3_ACCESS_KEY &&
  env.S3_SECRET_KEY
    ? new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
        forcePathStyle: true,
      })
    : null;

/**
 * Generate public URL for S3 object
 */
export function publicUrl(key: string): string {
  return `${env.CDN_BASE_URL}/${key}`;
}

/**
 * Generate S3 key for WhatsApp media
 */
export function buildKey(ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2);
  return `whatsapp/${timestamp}-${random}.${ext}`;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
  };

  return mimeMap[mimeType] || 'bin';
}

/**
 * Compute SHA256 hash of a buffer
 */
export function computeSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload buffer to S3
 */
export async function putBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Skip S3 operations during build
  if (isBuildContext || !s3Client) {
    return {
      success: false,
      error: 'S3 operations not available during build',
    };
  }

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      },
    });

    await upload.done();

    return {
      success: true,
      url: publicUrl(key),
    };
  } catch (error) {
    console.error('Failed to upload to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload base64 data to S3
 */
export async function putBase64(
  key: string,
  base64Data: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Skip S3 operations during build
  if (isBuildContext || !s3Client) {
    return {
      success: false,
      error: 'S3 operations not available during build',
    };
  }

  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    return await putBuffer(key, buffer, contentType);
  } catch (error) {
    console.error('Failed to process base64 data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid base64 data',
    };
  }
}

/**
 * Download file from URL and upload to S3
 */
export async function putFromUrl(
  key: string,
  url: string,
  contentType?: string
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
  isExpired?: boolean;
}> {
  // Skip S3 operations during build
  if (isBuildContext || !s3Client) {
    return {
      success: false,
      error: 'S3 operations not available during build',
    };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Check if it's a 404 or 403 (likely expired URL)
      if (response.status === 404 || response.status === 403) {
        console.warn(
          `Media URL appears to be expired (${response.status}): ${url}`
        );
        return {
          success: false,
          error: `Media URL expired (${response.status})`,
          isExpired: true,
        };
      }
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const finalContentType =
      contentType ||
      response.headers.get('content-type') ||
      'application/octet-stream';

    return await putBuffer(key, buffer, finalContentType);
  } catch (error) {
    console.error('Failed to upload from URL:', error);

    // Check if the error indicates an expired URL
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isExpired =
      errorMessage.includes('404') ||
      errorMessage.includes('403') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('not found');

    return {
      success: false,
      error: errorMessage,
      isExpired,
    };
  }
}
