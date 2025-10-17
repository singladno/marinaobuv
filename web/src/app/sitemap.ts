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
