import { useState, useEffect, useCallback, useRef } from 'react';
import { log } from '@/lib/logger';

import { useSearch } from '@/contexts/SearchContext';
import { FilterOptions } from '@/types/filters';

interface CatalogFilters {
  search: string;
  categoryId: string;
  sortBy: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  inStock: boolean;
  page: number;
  pageSize: number;
}

interface CatalogResponse {
  products: any[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filters: CatalogFilters;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

type UseCatalogBackendOptions = {
  initialFilters?: Partial<CatalogFilters>;
  skipInitialFetch?: boolean;
};

export function useCatalogBackend(options?: UseCatalogBackendOptions) {
  const { searchQuery } = useSearch();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<CatalogFilters>({
    search: options?.initialFilters?.search ?? searchQuery,
    categoryId: options?.initialFilters?.categoryId ?? '',
    sortBy: options?.initialFilters?.sortBy ?? 'newest',
    minPrice: options?.initialFilters?.minPrice,
    maxPrice: options?.initialFilters?.maxPrice,
    colors: options?.initialFilters?.colors ?? [],
    inStock: options?.initialFilters?.inStock ?? false,
    page: options?.initialFilters?.page ?? 1,
    pageSize: options?.initialFilters?.pageSize ?? 20,
  });

  // De-duplication guards (avoid duplicate fetches under StrictMode or identical requests)
  const inFlightKeyRef = useRef<string | null>(null);
  const lastSuccessKeyRef = useRef<string | null>(null);
  const isOptimisticUpdateRef = useRef(false);

  // Fetch products from backend
  function makeRequestKey(obj: CatalogFilters) {
    const ordered: any = {};
    Object.keys(obj)
      .sort()
      .forEach(k => {
        const v: any = (obj as any)[k];
        ordered[k] = Array.isArray(v) ? [...v].sort() : v;
      });
    return JSON.stringify(ordered);
  }

  const fetchProducts = useCallback(
    async (newFilters?: Partial<CatalogFilters>) => {
      // Skip fetch if we're in the middle of an optimistic update
      if (isOptimisticUpdateRef.current) {
        log.info('🛑 Skipping fetch during optimistic update');
        return;
      }

      const currentFilters = { ...filters, ...newFilters };
      const requestKey = makeRequestKey(currentFilters);

      // Skip if identical request is already in flight or just succeeded
      if (
        inFlightKeyRef.current === requestKey ||
        lastSuccessKeyRef.current === requestKey
      ) {
        log.info('🛑 Skipping duplicate catalog fetch', { currentFilters });
        return;
      }

      inFlightKeyRef.current = requestKey;
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();

        // Add all filter parameters
        if (currentFilters.search)
          searchParams.set('search', currentFilters.search);
        if (currentFilters.categoryId)
          searchParams.set('categoryId', currentFilters.categoryId);
        if (currentFilters.sortBy)
          searchParams.set('sortBy', currentFilters.sortBy);
        if (currentFilters.minPrice !== undefined)
          searchParams.set('minPrice', currentFilters.minPrice.toString());
        if (currentFilters.maxPrice !== undefined)
          searchParams.set('maxPrice', currentFilters.maxPrice.toString());
        if (currentFilters.colors.length > 0)
          searchParams.set('colors', currentFilters.colors.join(','));
        if (currentFilters.inStock) searchParams.set('inStock', 'true');
        searchParams.set('page', currentFilters.page.toString());
        searchParams.set('pageSize', currentFilters.pageSize.toString());

        const url = `/api/catalog?${searchParams.toString()}`;
        log.group('📡 Catalog fetch START', url);
        log.info('filters', currentFilters);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: CatalogResponse = await response.json();
        setProducts(data.products);
        setPagination(data.pagination);
        setFilters(currentFilters);
        lastSuccessKeyRef.current = requestKey;
        log.info('✅ Catalog fetch DONE', {
          count: data.products.length,
          pagination: data.pagination,
        });
        log.groupEnd();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        log.error('❌ Catalog fetch FAILED', err);
        setProducts([]);
      } finally {
        setLoading(false);
        inFlightKeyRef.current = null;
      }
    },
    [filters]
  );

  // Update filters when search query changes and fetch products
  useEffect(() => {
    if (searchQuery !== filters.search) {
      const newFilters = { ...filters, search: searchQuery, page: 1 };
      setFilters(newFilters);
      fetchProducts(newFilters);
    }
  }, [searchQuery, filters, fetchProducts]);

  // Handle search - now handled by SearchContext
  const handleSearch = useCallback(
    (query: string) => {
      const newFilters = { ...filters, search: query, page: 1 };
      setFilters(newFilters);
      fetchProducts(newFilters);
    },
    [filters, fetchProducts]
  );

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<CatalogFilters>) => {
      // Decide whether to reset page to 1 based on which filters changed
      const affectsResultSet =
        'search' in newFilters ||
        'categoryId' in newFilters ||
        'minPrice' in newFilters ||
        'maxPrice' in newFilters ||
        'colors' in newFilters ||
        'inStock' in newFilters ||
        'sortBy' in newFilters;

      const nextPage = affectsResultSet
        ? 1
        : newFilters.page !== undefined
          ? newFilters.page
          : filters.page;

      const updatedFilters: CatalogFilters = {
        ...filters,
        ...newFilters,
        page: nextPage,
      };

      setFilters(updatedFilters);
      fetchProducts(updatedFilters);
    },
    [filters, fetchProducts]
  );

  // Handle sorting
  const handleSortChange = useCallback(
    (sortBy: string) => {
      handleFiltersChange({ sortBy, page: 1 });
    },
    [handleFiltersChange]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      handleFiltersChange({ page });
    },
    [handleFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: CatalogFilters = {
      search: '',
      categoryId: '',
      sortBy: 'newest',
      minPrice: undefined,
      maxPrice: undefined,
      colors: [],
      inStock: false,
      page: 1,
      pageSize: 20,
    };
    setFilters(clearedFilters);
    fetchProducts(clearedFilters);
  }, [fetchProducts]);

  // Load initial data (optional)
  useEffect(() => {
    if (options?.skipInitialFetch) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update a single product optimistically (without refetching)
  // Preserves scroll position aggressively to prevent any scrolling
  const updateProduct = useCallback(
    (productId: string, updatedData: Partial<any>) => {
      // Mark that we're doing an optimistic update to prevent any fetches
      isOptimisticUpdateRef.current = true;

      // Aggressively preserve scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const scrollElement = document.documentElement || document.body;
      const savedScrollTop = scrollElement.scrollTop;

      setProducts(prevProducts => {
        // Only update if the product exists and data actually changed
        const productIndex = prevProducts.findIndex(p => p.id === productId);
        if (productIndex === -1) {
          isOptimisticUpdateRef.current = false;
          return prevProducts;
        }

        const currentProduct = prevProducts[productIndex];
        const updatedProduct = { ...currentProduct, ...updatedData };

        // If nothing changed, return same array reference to prevent re-render
        if (JSON.stringify(currentProduct) === JSON.stringify(updatedProduct)) {
          isOptimisticUpdateRef.current = false;
          return prevProducts;
        }

        // Create new array with only the updated product changed
        const updated = [...prevProducts];
        updated[productIndex] = updatedProduct;

        // Restore scroll position immediately and multiple times to ensure it sticks
        const restoreScroll = () => {
          window.scrollTo(scrollX, scrollY);
          if (scrollElement) {
            scrollElement.scrollTop = savedScrollTop;
          }
        };

        // Restore immediately
        restoreScroll();

        // Restore after React updates (multiple attempts to ensure it sticks)
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(() => {
            restoreScroll();
          }, 0);
          setTimeout(() => {
            restoreScroll();
            // Clear the flag after all updates are done
            isOptimisticUpdateRef.current = false;
          }, 50);
        });

        return updated;
      });
    },
    []
  );

  return {
    // State
    products,
    loading,
    error,
    pagination,
    filters,

    // Actions
    handleSearch,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    clearFilters,
    fetchProducts,
    updateProduct,
  };
}
