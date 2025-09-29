import { prisma } from '@/lib/server/db';

import { productInclude } from './product-includes';

interface ProductFilters {
  page: number;
  pageSize: number;
  search: string;
  categoryId: string;
}

export async function getProducts(filters: ProductFilters) {
  const skip = (filters.page - 1) * filters.pageSize;

  // Build where clause
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { article: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  where.isActive = true;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: filters.pageSize,
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}
