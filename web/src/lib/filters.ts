import type { CatalogFilters } from '@/types/filters';

function toInt(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseFilters(searchParams: URLSearchParams): CatalogFilters {
  // sizes: accept CSV in a single param and/or repeated params
  const sizeParams = searchParams.getAll('size');
  let sizes: string[] | undefined = undefined;
  if (sizeParams.length > 0) {
    const flat = sizeParams
      .flatMap(s => s.split(',').map(x => x.trim()))
      .filter(Boolean);
    sizes = Array.from(new Set(flat));
    if (sizes.length === 0) sizes = undefined;
  }

  const priceFrom = toInt(searchParams.get('priceFrom'));
  const priceTo = toInt(searchParams.get('priceTo'));

  let sort =
    (searchParams.get('sort') as CatalogFilters['sort']) ?? 'relevance';
  if (!['relevance', 'price-asc', 'price-desc', 'newest'].includes(sort))
    sort = 'relevance';

  const page = Math.max(1, toInt(searchParams.get('page')) ?? 1);
  const pageSize = Math.max(1, toInt(searchParams.get('pageSize')) ?? 24);

  // Validate price range
  let pf = priceFrom;
  let pt = priceTo;
  if (pf != null && pt != null && pf > pt) {
    // swap
    const t = pf;
    pf = pt;
    pt = t;
  }

  return {
    sizes,
    priceFrom: pf,
    priceTo: pt,
    sort,
    page,
    pageSize,
  };
}

export function buildQueryString(
  next: Partial<CatalogFilters> & { categoryId?: string },
  prev?: CatalogFilters & { categoryId?: string }
): string {
  const merged: CatalogFilters & { categoryId?: string } = {
    sizes: next.sizes ?? prev?.sizes,
    priceFrom: next.priceFrom ?? prev?.priceFrom ?? null,
    priceTo: next.priceTo ?? prev?.priceTo ?? null,
    sort: next.sort ?? prev?.sort ?? 'relevance',
    page: next.page ?? prev?.page ?? 1,
    pageSize: next.pageSize ?? prev?.pageSize ?? 24,
    categoryId: next.categoryId ?? prev?.categoryId,
  };

  const params = new URLSearchParams();
  if (merged.sizes && merged.sizes.length > 0) {
    for (const s of merged.sizes) params.append('size', s);
  }
  if (merged.priceFrom != null)
    params.set('priceFrom', String(merged.priceFrom));
  if (merged.priceTo != null) params.set('priceTo', String(merged.priceTo));
  if (merged.sort && merged.sort !== 'relevance')
    params.set('sort', merged.sort);
  if (merged.page && merged.page > 1) params.set('page', String(merged.page));
  if (merged.pageSize && merged.pageSize !== 24)
    params.set('pageSize', String(merged.pageSize));
  if (merged.categoryId) params.set('categoryId', merged.categoryId);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
