import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';

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
  /** Admin-only: filter by source ids (e.g. WA:chatId, TG:chatId, AG, MANUAL) */
  sourceIds?: string[];
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
  debug?: {
    searchHistorySaved: boolean;
    searchQuery: string;
    timestamp: string;
    sessionUserId: string;
    hasSession: boolean;
    searchHistoryDebug: any;
  };
}

interface CategoryData {
  subcategories?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  siblingCategories?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  parentChildren?: Array<{
    id: string;
    name: string;
    path: string;
    href: string;
    hasChildren?: boolean;
  }>;
  parentCategory?: {
    id: string;
    name: string;
    path: string;
    href: string;
  } | null;
  breadcrumbs?: any[];
}

export function useInfiniteCatalog(
  initialCategoryId?: string,
  waitForCategory = false,
  sharedCategoryData?: CategoryData
) {
  const { searchQuery } = useSearch();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20, // Aligned with backend default
    totalPages: 0,
  });

  const [filters, setFilters] = useState<CatalogFilters>({
    search: searchQuery,
    categoryId: initialCategoryId || '',
    sortBy: 'newest',
    minPrice: undefined,
    maxPrice: undefined,
    colors: [],
    inStock: false,
    page: 1,
    pageSize: 20, // Aligned with backend default
    sourceIds: [],
  });

  // Use refs to track if we've already made initial requests
  const hasInitialized = useRef(false);
  const lastSearchQuery = useRef(searchQuery);
  const lastCategoryId = useRef(initialCategoryId);
  const requestInProgress = useRef(false);
  const currentFiltersRef = useRef(filters);
  const isOptimisticUpdateRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const lastRequestKeyRef = useRef<string | null>(null);
  const inFlightRequestKeyRef = useRef<string | null>(null);

  // Update filters ref whenever filters change
  useEffect(() => {
    currentFiltersRef.current = filters;
  }, [filters]);

  // Update loadingMore ref whenever loadingMore state changes
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  const hasNextPage = useMemo(() => {
    const hasMore = pagination.page < pagination.totalPages;
    return hasMore;
  }, [
    pagination.page,
    pagination.totalPages,
    pagination.total,
    allProducts.length,
  ]);

  // Fetch products from backend
  const fetchProducts = useCallback(
    async (newFilters?: Partial<CatalogFilters>, append = false) => {
      // Skip fetch if we're in the middle of an optimistic update
      if (isOptimisticUpdateRef.current) {
        return;
      }

      // Get current filters from state at the time of call
      const currentFilters = currentFiltersRef.current;
      const updatedFilters = { ...currentFilters, ...newFilters };

      // Create a unique request key for deduplication
      const requestKey = JSON.stringify({
        page: updatedFilters.page,
        pageSize: updatedFilters.pageSize,
        search: updatedFilters.search,
        categoryId: updatedFilters.categoryId,
        sortBy: updatedFilters.sortBy,
        minPrice: updatedFilters.minPrice,
        maxPrice: updatedFilters.maxPrice,
        colors: (updatedFilters.colors ?? []).sort(),
        inStock: updatedFilters.inStock,
        sourceIds: (updatedFilters.sourceIds ?? []).sort(),
        append,
      });

      // When user changes source filter, always refetch (don't skip due to dedup)
      if (newFilters && 'sourceIds' in newFilters) {
        lastRequestKeyRef.current = null;
      }

      // Prevent duplicate requests - check if same request is in flight or just completed
      if (
        inFlightRequestKeyRef.current === requestKey ||
        lastRequestKeyRef.current === requestKey
      ) {
        return;
      }

      // Prevent multiple simultaneous requests
      if (requestInProgress.current) {
        return;
      }

      const isInitialLoad = !append;
      if (isInitialLoad) {
        requestInProgress.current = true;
        inFlightRequestKeyRef.current = requestKey;
        setLoading(true);
      } else {
        // For append requests, also check if we're already loading more (use ref to avoid stale closure)
        if (loadingMoreRef.current) {
          return;
        }
        requestInProgress.current = true;
        inFlightRequestKeyRef.current = requestKey;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      setError(null);

      try {
        // Update filters state
        setFilters(updatedFilters);

        const searchParams = new URLSearchParams();

        // Add all filter parameters
        if (updatedFilters.search)
          searchParams.set('search', updatedFilters.search);
        if (updatedFilters.categoryId)
          searchParams.set('categoryId', updatedFilters.categoryId);
        if (updatedFilters.sortBy)
          searchParams.set('sortBy', updatedFilters.sortBy);
        if (updatedFilters.minPrice !== undefined)
          searchParams.set('minPrice', updatedFilters.minPrice.toString());
        if (updatedFilters.maxPrice !== undefined)
          searchParams.set('maxPrice', updatedFilters.maxPrice.toString());
        if ((updatedFilters.colors ?? []).length > 0)
          searchParams.set('colors', (updatedFilters.colors ?? []).join(','));
        if (updatedFilters.inStock) searchParams.set('inStock', 'true');
        if (
          updatedFilters.sourceIds &&
          updatedFilters.sourceIds.length > 0
        ) {
          searchParams.set('sourceIds', updatedFilters.sourceIds.join(','));
        }
        searchParams.set('page', updatedFilters.page.toString());
        searchParams.set('pageSize', updatedFilters.pageSize.toString());

        const url = `/api/catalog?${searchParams.toString()}`;

        // Make the request
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch products');
            }
            return response.json();
          })
          .then(data => {
            if (append) {
              // Append new products to existing ones
              setAllProducts(prev => [...prev, ...data.products]);
            } else {
              // Replace all products (new search/filter)
              setAllProducts(data.products);
            }

            setPagination(data.pagination);
            // Mark this request as successfully completed
            lastRequestKeyRef.current = requestKey;
          })
          .catch(err => {
            setError(err instanceof Error ? err.message : 'Unknown error');
            if (!append) {
              setAllProducts([]);
            }
          })
          .finally(() => {
            setLoading(false);
            setLoadingMore(false);
            loadingMoreRef.current = false;
            requestInProgress.current = false;
            inFlightRequestKeyRef.current = null;
          });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        if (!append) {
          setAllProducts([]);
        }
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
        requestInProgress.current = false;
        inFlightRequestKeyRef.current = null;
      }
    },
    [] // Remove dependencies to prevent cascade re-renders
  );

  // Load more products (for infinite scroll)
  const loadMore = useCallback(() => {
    // Prevent duplicate calls - check both state and refs
    if (
      hasNextPage &&
      !loadingMoreRef.current &&
      !loading &&
      !requestInProgress.current
    ) {
      const nextPage = pagination.page + 1;
      fetchProducts({ page: nextPage }, true);
    } else {
    }
  }, [hasNextPage, loading, pagination.page, fetchProducts]);

  // Retry loading more products
  const retryLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasNextPage, loadingMore, loading, loadMore]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<CatalogFilters>) => {
      const updatedFilters = { ...currentFiltersRef.current, ...newFilters };
      if (newFilters?.sourceIds !== undefined) {
        updatedFilters.page = 1;
      }
      setFilters(updatedFilters);
      fetchProducts(updatedFilters, false);
    },
    [fetchProducts]
  );

  // Handle sorting
  const handleSortChange = useCallback(
    (sortBy: string) => {
      handleFiltersChange({ sortBy, page: 1 });
    },
    [handleFiltersChange]
  );

  // Clear all filters but preserve the current category context
  const clearFilters = useCallback(() => {
    const clearedFilters: CatalogFilters = {
      search: '',
      categoryId: initialCategoryId || '', // Preserve the current category from URL
      sortBy: 'newest',
      minPrice: undefined,
      maxPrice: undefined,
      colors: [],
      inStock: false,
      page: 1,
      pageSize: 20,
      sourceIds: [],
    };
    setFilters(clearedFilters);
    fetchProducts(clearedFilters, false);
  }, [initialCategoryId, fetchProducts]);

  // Handle search query changes
  useEffect(() => {
    // Only trigger if search query actually changed and we're initialized
    if (searchQuery !== lastSearchQuery.current && hasInitialized.current) {
      lastSearchQuery.current = searchQuery;
      const newFilters = {
        ...currentFiltersRef.current,
        search: searchQuery,
        page: 1,
      };
      setFilters(newFilters);
      fetchProducts(newFilters, false);
    } else if (searchQuery !== lastSearchQuery.current) {
      // Update the ref even if not initialized yet
      lastSearchQuery.current = searchQuery;
    }
  }, [searchQuery]);

  // Handle initial category ID changes
  useEffect(() => {
    if (initialCategoryId !== lastCategoryId.current) {
      lastCategoryId.current = initialCategoryId;
      // Create new filters and update state
      const newFilters = {
        ...currentFiltersRef.current,
        categoryId: initialCategoryId || '',
        page: 1,
      };
      setFilters(newFilters);
      // Fetch products with the new filters
      fetchProducts(newFilters, false);
      // Mark as initialized since we're handling the initial load
      hasInitialized.current = true;
    }
  }, [initialCategoryId]);

  // Load initial data only once
  useEffect(() => {
    // Skip initialization entirely if we're on a category page (waitForCategory = true)
    if (waitForCategory) {
      return;
    }

    // Only initialize once - use refs to check state without causing re-renders
    if (!hasInitialized.current && !requestInProgress.current) {
      hasInitialized.current = true;
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

      setAllProducts(prevProducts => {
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
    products: allProducts,
    loading,
    loadingMore,
    error,
    pagination,
    filters,
    hasNextPage,

    // Shared category data
    categoryData: sharedCategoryData,

    // Actions
    handleFiltersChange,
    handleSortChange,
    clearFilters,
    loadMore,
    retryLoadMore,
    fetchProducts,
    updateProduct,
  };
}
