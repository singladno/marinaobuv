import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
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
}
