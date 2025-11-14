import type { Prisma } from '@prisma/client';

import type { CatalogFilters } from '@/types/filters';

import { dbPathFromInput } from './catalog-utils';
import { prisma } from './server/db';

export async function listProductsByCategoryPath(
  categoryPath?: string,
  filters?: CatalogFilters,
  page = 1,
  limit = 20
) {
  const dbPath = dbPathFromInput(categoryPath);

  if (!dbPath) {
    // If no category path, return all products
    return await listProductsByCategoryId(null, filters, page, limit);
  }

  const category = await prisma.category.findFirst({
    where: { path: dbPath, isActive: true },
  });

  if (!category) {
    return {
      products: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  return await listProductsByCategoryId(category.id, filters, page, limit);
}

export async function listProductsByCategoryId(
  categoryId: string | null,
  filters?: CatalogFilters,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Apply filters (aligned with current CatalogFilters type)
  if (filters) {
    const { priceFrom, priceTo } = filters as any;
    if (priceFrom !== undefined && priceFrom !== null) {
      (where as any).pricePair = { gte: priceFrom };
    }
    if (priceTo !== undefined && priceTo !== null) {
      (where as any).pricePair = { ...(where as any).pricePair, lte: priceTo };
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          where: {
            isActive: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Transform the data to include primaryImageUrl and colorOptions
  const transformedProducts = products.map(product => {
    const primaryImageUrl = product.images[0]?.url || null;
    const seen = new Set<string>();
    const colorOptions = product.images
      .filter(img => !!img.color)
      .filter(img => {
        const key = (img.color || '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(img => ({ color: img.color as string, imageUrl: img.url }));

    return {
      ...product,
      pricePair: product.pricePair.toString(),
      primaryImageUrl,
      colorOptions,
    };
  });

  return {
    products: transformedProducts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
