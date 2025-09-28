import type { Prisma } from '@prisma/client';

import type { CatalogFilters } from '@/types/filters';

import { dbPathFromInput } from './catalog-utils';
import { prisma } from './db-node';

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

  // Apply filters
  if (filters) {
    if (filters.minPrice !== undefined) {
      where.pricePair = { gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      where.pricePair = { ...where.pricePair, lte: filters.maxPrice };
    }
    if (filters.gender && filters.gender.length > 0) {
      where.gender = { in: filters.gender };
    }
    if (filters.season && filters.season.length > 0) {
      where.season = { in: filters.season };
    }
    if (filters.material && filters.material.length > 0) {
      where.material = { in: filters.material };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { material: { contains: filters.search, mode: 'insensitive' } },
      ];
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
          where: { isActive: true },
          orderBy: { sort: 'asc' },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
