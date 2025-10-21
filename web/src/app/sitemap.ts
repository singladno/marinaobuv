import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/server/db';
import { buildCategoryPath } from '@/lib/catalog-utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: '/',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: '/about',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Check if we're in a CI environment
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (isCI) {
    // In CI environment, return static entries only (no database access)
    console.log('Running in CI environment, returning static sitemap entries only');
    return staticEntries;
  }

  // For server builds, database MUST be available
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required for sitemap generation but not found in environment variables'
    );
  }

  // Attempt to fetch categories from database
  // If this fails, the build should fail (database is required on server)
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { path: true, updatedAt: true, seoNoindex: true },
  });

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter(c => c.seoNoindex !== true)
    .map(c => ({
      url: `/catalog/${buildCategoryPath({ path: c.path, name: '' })}`,
      lastModified: c.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  return [...staticEntries, ...categoryEntries];
}
