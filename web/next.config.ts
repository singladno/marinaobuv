import path from 'path';

import type { NextConfig } from 'next';

function computeRemotePatterns() {
  const patterns: { protocol: 'https'; hostname: string; pathname: string }[] = [];
  const cdn = process.env.CDN_BASE_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  if (cdn) {
    try {
      const u = new URL(cdn);
      patterns.push({ protocol: 'https', hostname: u.hostname, pathname: '/**' });
    } catch {}
  }
  if (endpoint && bucket) {
    try {
      const host = new URL(endpoint).hostname;
      patterns.push({ protocol: 'https', hostname: `${bucket}.${host}`, pathname: '/**' });
    } catch {}
  }
  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: computeRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
