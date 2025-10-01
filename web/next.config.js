import path from 'path';

function computeRemotePatterns() {
  const patterns = [];
  const cdn = process.env.CDN_BASE_URL;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;

  // Add Wasabi S3 hostname directly for now
  patterns.push({
    protocol: 'https',
    hostname: 's3.eu-central-1.wasabisys.com',
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

const nextConfig = {
  // Silence workspace root inference in CI with multiple lockfiles
  outputFileTracingRoot: process.cwd(),
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    remotePatterns: computeRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Build optimizations
  eslint: {
    // Enable ESLint during builds and development
    ignoreDuringBuilds: false,
    // Show ESLint errors and warnings in the console during development
    dirs: ['src'],
  },
  typescript: {
    // Enable TypeScript checking during builds and development
    ignoreBuildErrors: false,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
