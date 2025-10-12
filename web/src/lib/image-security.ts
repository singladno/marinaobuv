/**
 * Image security and optimization utilities for WA parser images
 */

/**
 * Generate a thumbnail URL for WA parser images
 * For now, we'll use the original URL but this can be enhanced with image resizing
 */
export function getThumbnailUrl(
  originalUrl: string
  /* size: number = 150 */
): string {
  // Fix double https:// issue
  if (originalUrl && originalUrl.startsWith('https://https://')) {
    return originalUrl.replace('https://https://', 'https://');
  }

  // For WA parser images, we'll use the original URL for now
  // TODO: Implement image resizing service if needed
  return originalUrl;
}

/**
 * Generate a full-size URL for modal display
 * For WA parser images, we can use the original URL
 */
export function getFullSizeUrl(originalUrl: string): string {
  // Fix double https:// issue
  if (originalUrl && originalUrl.startsWith('https://https://')) {
    return originalUrl.replace('https://https://', 'https://');
  }

  return originalUrl;
}

/**
 * Generate a signed URL for secure image access
 * This should be implemented with your S3 backend
 */
export async function getSignedImageUrl(
  imageUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  // TODO: Implement with your backend API
  // This should call an API endpoint that generates signed URLs
  const response = await fetch('/api/images/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, expiresIn }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate signed URL');
  }

  const { signedUrl } = await response.json();
  return signedUrl;
}

/**
 * Check if an image URL is from WA parser (trusted source)
 */
export function isTrustedImageUrl(url: string): boolean {
  const trustedDomains = [
    's3.eu-central-1.wasabisys.com', // Your S3 bucket
    // Add other trusted domains if needed
  ];

  try {
    const urlObj = new URL(url);
    return trustedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Check if image is from WA parser based on URL pattern
 */
export function isWAParserImage(url: string): boolean {
  // WA parser images typically have specific URL patterns
  return url.includes('s3.eu-central-1.wasabisys.com/in-files/');
}

/**
 * Check if image is from our Yandex S3 storage (uploaded during approval)
 */
export function isS3Image(url: string): boolean {
  // Check for our CDN base URL (Yandex S3 images uploaded during approval)
  // Using hardcoded CDN base URL to avoid server-side env import in client components
  const cdnBaseUrl = 'https://storage.yandexcloud.net/marinaobuv-photos';

  try {
    const urlObj = new URL(url);
    const cdnUrlObj = new URL(cdnBaseUrl);
    return urlObj.hostname === cdnUrlObj.hostname;
  } catch {
    // If URL parsing fails, fall back to string matching
    return url.startsWith(cdnBaseUrl);
  }
}

/**
 * Sanitize image URL to prevent XSS
 */
export function sanitizeImageUrl(url: string): string {
  // Remove any potentially dangerous characters
  return url.replace(/[<>'"]/g, '');
}

/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a fallback image URL when the original fails
 */
export function getFallbackImageUrl(): string {
  return '/images/placeholder.jpg';
}
