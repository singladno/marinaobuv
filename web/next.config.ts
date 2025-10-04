import path from 'path';

import type { NextConfig } from 'next';

function computeRemotePatterns() {
  const patterns: { protocol: 'https'; hostname: string; pathname: string }[] =
    [];
  const cdn = process.env.CDN_BASE_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;

  // Add Wasabi S3 hostname directly for now
  patterns.push({
    protocol: 'https',
    hostname: 's3.eu-central-1.wasabisys.com',
    pathname: '/**',
  });

  // Add Yandex Cloud Storage hostname
  patterns.push({
    protocol: 'https',
    hostname: 'storage.yandexcloud.net',
    pathname: '/**',
  });

  // Add Yandex Cloud Storage subdomain for WhatsApp media
  patterns.push({
    protocol: 'https',
    hostname: 'sw-media-1105.storage.yandexcloud.net',
    pathname: '/**',
  });

  if (cdn) {
    try {
      const u = new URL(cdn);
      patterns.push({
        protocol: 'https',
        hostname: u.hostname,
        pathname: '/**',
      });
    } catch {}
  }
  if (endpoint && bucket) {
    try {
      const host = new URL(endpoint).hostname;
      patterns.push({
        protocol: 'https',
        hostname: `${bucket}.${host}`,
        pathname: '/**',
      });
    } catch {}
  }
  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: computeRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    // Enable ESLint during builds and development
    ignoreDuringBuilds: false,
    // Show ESLint errors and warnings in the console during development
    dirs: ['src'],
  },
  // Ignore Next.js type validator errors during development
  typedRoutes: false,
  typescript: {
    // Enable TypeScript checking during builds and development
    ignoreBuildErrors: false,
  },
  // Skip type checking during development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Fix workspace root warning
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
