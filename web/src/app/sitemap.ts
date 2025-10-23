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

  // Check if we're in a build environment without database access
  const isBuildEnvironment =
    process.env.NODE_ENV === 'production' &&
    (!process.env.DATABASE_URL ||
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true');

  if (isBuildEnvironment) {
    // In build environment without database access, return static entries only
    console.log(
      'Running in build environment without database access, returning static sitemap entries only'
    );
    return staticEntries;
  }

  // Try to fetch categories from database, but don't fail the build if it's not available
  try {
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
  } catch (error) {
    console.warn(
      'Failed to fetch categories for sitemap, using static entries only:',
      error
    );
    return staticEntries;
  }
}
