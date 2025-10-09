import path from 'path';

function computeRemotePatterns() {
  const patterns = [];
  const cdn = process.env.CDN_BASE_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;

  // Wasabi S3
  patterns.push({
    protocol: 'https',
    hostname: 's3.eu-central-1.wasabisys.com',
    pathname: '/**',
  });

  // Yandex Cloud Storage
  patterns.push({
    protocol: 'https',
    hostname: 'storage.yandexcloud.net',
    pathname: '/**',
  });
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: computeRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  outputFileTracingRoot: path.join(process.cwd(), '..'),
  webpack: config => {
    // Ensure '@' alias resolves to src for both server and client builds
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(process.cwd(), 'src'),
    };
    return config;
  },
};

export default nextConfig;
