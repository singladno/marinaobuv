// Re-export types and functions from decomposed modules
export type { CategoryNode } from './catalog-categories';
export {
  getCategoryTree,
  getCategoryByPath,
  getCategoryById,
  getAllCategories,
} from './catalog-categories';
export {
  listProductsByCategoryPath,
  listProductsByCategoryId,
} from './catalog-products';
export {
  normalizeInputPath,
  dbPathFromInput,
  buildCategoryPath,
  buildCategoryBreadcrumbs,
} from './catalog-utils';

// Legacy types and functions that need to be preserved
export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  primaryImageUrl: string | null;
};

// Additional functions that weren't moved to decomposed modules
export async function getSizeFacetsForPath(
  path?: string
): Promise<Array<{ size: string; count: number }>> {
  const { normalizeInputPath, dbPathFromInput } = await import(
    './catalog-utils'
  );
  const { prisma } = await import('./db-node');

  const input = normalizeInputPath(path);
  const full = dbPathFromInput(input);

  let where: any = {};
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
  const { normalizeInputPath, dbPathFromInput } = await import(
    './catalog-utils'
  );
  const { prisma } = await import('./db-node');

  const input = normalizeInputPath(path);
  const full = dbPathFromInput(input);

  let where: any = {};
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
  return { min: Math.floor(Number(min)), max: Math.floor(Number(max)) };
}

export async function getPriceBoundsForCategoryId(
  categoryId?: string
): Promise<{ min: number; max: number }> {
  const { prisma } = await import('./db-node');

  let where: any = {};
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
  return { min: Math.floor(Number(min)), max: Math.floor(Number(max)) };
}
