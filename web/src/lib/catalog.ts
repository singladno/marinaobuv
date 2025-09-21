import type { Prisma } from '@prisma/client';

import { prisma } from './db-node';
import type { CatalogFilters } from '@/types/filters';

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  path: string; // stored as obuv/...
  children: CategoryNode[];
};

function normalizeInputPath(path?: string) {
  if (!path) return undefined;
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed.length ? trimmed : undefined;
}

function dbPathFromInput(path?: string) {
  const normalized = normalizeInputPath(path);
  return normalized ? `obuv/${normalized}` : undefined;
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const roots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sort: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      },
    },
  });

  return roots.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    path: r.path,
    children: r.children.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      path: c.path,
      children: [],
    })),
  }));
}

export async function getCategoryByPath(path: string) {
  const full = dbPathFromInput(path);
  if (!full) return null;
  return prisma.category.findUnique({
    where: { path: full },
    include: { parent: true, children: true },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true },
  });
}

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  primaryImageUrl: string | null;
};

export async function listProductsByCategoryPath(opts: {
  path?: string;
  filters?: CatalogFilters;
}): Promise<{
  items: ProductCardDTO[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, opts.filters?.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, opts.filters?.pageSize ?? 24));

  const input = normalizeInputPath(opts.path);
  const full = dbPathFromInput(input);

  let where: Prisma.ProductWhereInput = {};
  if (full) {
    const isSeason = !input?.includes('/');
    if (isSeason) {
      where = { category: { path: { startsWith: full } } };
    } else {
      where = { category: { path: full } };
    }
  }

  // Price filter (now in rubles, no conversion needed)
  const pf = opts.filters?.priceFrom;
  const pt = opts.filters?.priceTo;
  if (pf != null || pt != null) {
    const priceFilter: Prisma.DecimalFilter = {};
    if (pf != null) priceFilter.gte = pf;
    if (pt != null) priceFilter.lte = pt;
    where.pricePair = priceFilter;
  }

  // Size filter removed

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput | undefined = undefined;
  const sort = opts.filters?.sort ?? 'relevance';
  if (sort === 'price-asc') orderBy = { pricePair: 'asc' };
  else if (sort === 'price-desc') orderBy = { pricePair: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };
  else orderBy = { createdAt: 'desc' }; // relevance fallback

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        pricePair: true,
        currency: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items: ProductCardDTO[] = rows.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    pricePair: p.pricePair,
    currency: p.currency,
    primaryImageUrl: p.images[0]?.url ?? null,
  }));

  return { items, total, page, pageSize };
}

export async function listProductsByCategoryId(opts: {
  categoryId?: string;
  filters?: CatalogFilters;
}): Promise<{
  items: ProductCardDTO[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, opts.filters?.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, opts.filters?.pageSize ?? 24));

  let where: Prisma.ProductWhereInput = {};
  if (opts.categoryId) {
    // Get the category to determine if it's a season (parent) or subcategory
    const category = await prisma.category.findUnique({
      where: { id: opts.categoryId },
      select: { path: true, children: { select: { id: true } } },
    });

    if (category) {
      const isSeason = category.children.length > 0;
      if (isSeason) {
        // Include all subcategories
        where = { category: { path: { startsWith: category.path } } };
      } else {
        // Only this specific category
        where = { categoryId: opts.categoryId };
      }
    }
  }

  // Price filter (now in rubles, no conversion needed)
  const pf = opts.filters?.priceFrom;
  const pt = opts.filters?.priceTo;
  if (pf != null || pt != null) {
    const priceFilter: Prisma.DecimalFilter = {};
    if (pf != null) priceFilter.gte = pf;
    if (pt != null) priceFilter.lte = pt;
    where.pricePair = priceFilter;
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput | undefined = undefined;
  const sort = opts.filters?.sort ?? 'relevance';
  if (sort === 'price-asc') orderBy = { pricePair: 'asc' };
  else if (sort === 'price-desc') orderBy = { pricePair: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };
  else orderBy = { createdAt: 'desc' }; // relevance fallback

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        pricePair: true,
        currency: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items: ProductCardDTO[] = rows.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    pricePair: p.pricePair,
    currency: p.currency,
    primaryImageUrl: p.images[0]?.url ?? null,
  }));

  return { items, total, page, pageSize };
}

export async function getSizeFacetsForPath(
  path?: string
): Promise<Array<{ size: string; count: number }>> {
  const input = normalizeInputPath(path);
  const full = dbPathFromInput(input);

  let where: Prisma.ProductSizeWhereInput = {};
  if (full) {
    const isSeason = !input?.includes('/');
    if (isSeason)
      where = { product: { category: { path: { startsWith: full } } } };
    else where = { product: { category: { path: full } } };
  }

  const rows = await prisma.productSize.groupBy({
    by: ['size'],
    where,
    _count: { _all: true },
  });

  const facets = rows.map(r => ({ size: r.size, count: r._count._all }));
  // Sort numerically if possible
  facets.sort((a, b) => {
    const na = Number(a.size);
    const nb = Number(b.size);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.size.localeCompare(b.size);
  });
  return facets;
}

export async function getPriceBoundsForPath(
  path?: string
): Promise<{ min: number; max: number }> {
  const input = normalizeInputPath(path);
  const full = dbPathFromInput(input);

  let where: Prisma.ProductWhereInput = {};
  if (full) {
    const isSeason = !input?.includes('/');
    if (isSeason) where = { category: { path: { startsWith: full } } };
    else where = { category: { path: full } };
  }

  const agg = await prisma.product.aggregate({
    where,
    _min: { pricePair: true },
    _max: { pricePair: true },
  });
  const min = agg._min.pricePair ?? 0;
  const max = agg._max.pricePair ?? 0;
  return { min: Math.floor(min), max: Math.floor(max) };
}

export async function getPriceBoundsForCategoryId(
  categoryId?: string
): Promise<{ min: number; max: number }> {
  let where: Prisma.ProductWhereInput = {};
  if (categoryId) {
    // Get the category to determine if it's a season (parent) or subcategory
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { path: true, children: { select: { id: true } } },
    });

    if (category) {
      const isSeason = category.children.length > 0;
      if (isSeason) {
        // Include all subcategories
        where = { category: { path: { startsWith: category.path } } };
      } else {
        // Only this specific category
        where = { categoryId };
      }
    }
  }

  const agg = await prisma.product.aggregate({
    where,
    _min: { pricePair: true },
    _max: { pricePair: true },
  });
  const min = agg._min.pricePair ?? 0;
  const max = agg._max.pricePair ?? 0;
  return { min: Math.floor(min), max: Math.floor(max) };
}
