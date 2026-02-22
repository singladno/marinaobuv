'use client';

import { useEffect, useRef } from 'react';

// Keep this local type minimal and aligned with useCatalogBackend's filters
type PersistableCatalogFilters = {
  search: string;
  sortBy: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  inStock: boolean;
  page: number;
  pageSize: number;
  sourceIds?: string[];
  // categoryId is controlled by the page via category path; don't persist/restore it here
};

const STORAGE_PREFIX = 'catalog:filters:';

export function getCatalogFiltersStorageKey(pathname: string) {
  return `${STORAGE_PREFIX}${pathname}`;
}

export function loadPersistedCatalogFilters(
  pathname: string
): Partial<PersistableCatalogFilters> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(
      getCatalogFiltersStorageKey(pathname)
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistableCatalogFilters;
    if (!parsed || typeof parsed !== 'object') return null;
    // Basic shape validation to guard against stale structures
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      sortBy: typeof parsed.sortBy === 'string' ? parsed.sortBy : 'newest',
      minPrice:
        typeof parsed.minPrice === 'number' ? parsed.minPrice : undefined,
      maxPrice:
        typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined,
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      inStock: Boolean(parsed.inStock),
      page: Number.isFinite(parsed.page) ? parsed.page : 1,
      pageSize: Number.isFinite(parsed.pageSize) ? parsed.pageSize : 20,
      sourceIds: Array.isArray(parsed.sourceIds) ? parsed.sourceIds : [],
    };
  } catch {
    return null;
  }
}

export function usePersistCatalogFilters(
  pathname: string | null | undefined,
  filters: PersistableCatalogFilters,
  options?: { enabled?: boolean }
) {
  const lastPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname) return;
    lastPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;
    if (options && options.enabled === false) return;
    // Persist only the allowed subset
    const toPersist: PersistableCatalogFilters = {
      search: filters.search,
      sortBy: filters.sortBy,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      colors: filters.colors,
      inStock: filters.inStock,
      page: filters.page,
      pageSize: filters.pageSize,
      sourceIds: filters.sourceIds,
    };
    try {
      window.localStorage.setItem(
        getCatalogFiltersStorageKey(pathname),
        JSON.stringify(toPersist)
      );
    } catch {
      // ignore quota or serialization errors
    }
  }, [
    options?.enabled,
    pathname,
    filters.search,
    filters.sortBy,
    filters.minPrice,
    filters.maxPrice,
    filters.colors,
    filters.inStock,
    filters.page,
    filters.pageSize,
    filters.sourceIds,
  ]);
}
