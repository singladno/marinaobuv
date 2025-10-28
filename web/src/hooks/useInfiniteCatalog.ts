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
  });

  // Use refs to track if we've already made initial requests
  const hasInitialized = useRef(false);
  const lastSearchQuery = useRef(searchQuery);
  const lastCategoryId = useRef(initialCategoryId);
  const requestInProgress = useRef(false);
  const currentFiltersRef = useRef(filters);

  // Update filters ref whenever filters change
  useEffect(() => {
    currentFiltersRef.current = filters;
  }, [filters]);
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
      console.log(
        '🔄 fetchProducts called. append:',
        append,
        'newFilters:',
        newFilters
      );

      // Prevent multiple simultaneous requests only for non-append requests
      if (requestInProgress.current && !append) {
        console.log('🚫 fetchProducts: Request already in progress, skipping.');
        return;
      }

      const isInitialLoad = !append;
      if (isInitialLoad) {
        requestInProgress.current = true;
        setLoading(true);
        console.log(
          '⏳ fetchProducts: Setting loading to true for initial load.'
        );
      } else {
        setLoadingMore(true);
        console.log(
          '⏳ fetchProducts: Setting loadingMore to true for append.'
        );
      }
      setError(null);

      try {
        // Get current filters from state at the time of call
        setFilters(currentFilters => {
          const updatedFilters = { ...currentFilters, ...newFilters };
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
          if (updatedFilters.colors.length > 0)
            searchParams.set('colors', updatedFilters.colors.join(','));
          if (updatedFilters.inStock) searchParams.set('inStock', 'true');
          searchParams.set('page', updatedFilters.page.toString());
          searchParams.set('pageSize', updatedFilters.pageSize.toString());

          const url = `/api/catalog?${searchParams.toString()}`;
          console.log('📡 fetchProducts: Making API call to:', url);

          // Make the request
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to fetch products');
              }
              return response.json();
            })
            .then(data => {
              console.log(
                '✅ fetchProducts: API call successful. Products received:',
                data.products.length
              );
              if (append) {
                // Append new products to existing ones
                setAllProducts(prev => [...prev, ...data.products]);
              } else {
                // Replace all products (new search/filter)
                setAllProducts(data.products);
              }

              setPagination(data.pagination);
            })
            .catch(err => {
              setError(err instanceof Error ? err.message : 'Unknown error');
              if (!append) {
                setAllProducts([]);
              }
            })
            .finally(() => {
              console.log('🏁 fetchProducts: Finally block executed.');
              setLoading(false);
              setLoadingMore(false);
              if (isInitialLoad) {
                requestInProgress.current = false;
                console.log(
                  '🔓 fetchProducts: Resetting requestInProgress for initial load.'
                );
              }
            });

          return updatedFilters;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        if (!append) {
          setAllProducts([]);
        }
        setLoading(false);
        setLoadingMore(false);
        if (isInitialLoad) {
          requestInProgress.current = false;
        }
      }
    },
    [] // Remove dependencies to prevent cascade re-renders
  );

  // Load more products (for infinite scroll)
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      const nextPage = pagination.page + 1;
      fetchProducts({ page: nextPage }, true);
    }
  }, [hasNextPage, loadingMore, loading, pagination.page]);

  // Retry loading more products
  const retryLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasNextPage, loadingMore, loading, loadMore]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<CatalogFilters>) => {
      const updatedFilters = { ...filters, ...newFilters, page: 1 };
      setFilters(updatedFilters);
      fetchProducts(updatedFilters, false);
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
    };
    setFilters(clearedFilters);
    fetchProducts(clearedFilters, false);
  }, [initialCategoryId]);

  // Handle search query changes
  useEffect(() => {
    console.log(
      '🔍 useEffect (searchQuery): Checking search query. Current:',
      searchQuery,
      'Last:',
      lastSearchQuery.current
    );
    if (searchQuery !== lastSearchQuery.current) {
      console.log(
        '🔍 useEffect (searchQuery): Search query changed from',
        lastSearchQuery.current,
        'to',
        searchQuery
      );
      lastSearchQuery.current = searchQuery;
      const newFilters = { ...filters, search: searchQuery, page: 1 };
      setFilters(newFilters);
      fetchProducts(newFilters, false);
    }
  }, [searchQuery]);

  // Handle initial category ID changes
  useEffect(() => {
    console.log(
      '🏷️ useEffect (initialCategoryId): Checking category ID. Current:',
      initialCategoryId,
      'Last:',
      lastCategoryId.current
    );
    if (initialCategoryId !== lastCategoryId.current) {
      console.log(
        '🏷️ useEffect (initialCategoryId): Category ID changed from',
        lastCategoryId.current,
        'to',
        initialCategoryId
      );
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
    console.log(
      '🚀 useEffect (initial load): Checking initialization status. hasInitialized:',
      hasInitialized.current,
      'allProducts.length:',
      allProducts.length,
      'loading:',
      loading,
      'waitForCategory:',
      waitForCategory,
      'initialCategoryId:',
      initialCategoryId
    );

    // Skip initialization entirely if we're on a category page (waitForCategory = true)
    if (waitForCategory) {
      console.log(
        '⏳ useEffect (initial load): On category page, skipping initialization - category effect will handle it.'
      );
      return;
    }

    if (!hasInitialized.current && allProducts.length === 0 && !loading) {
      console.log(
        '✅ useEffect (initial load): Initializing catalog (main page) with categoryId:',
        initialCategoryId
      );
      hasInitialized.current = true;
      fetchProducts();
    }
  }, [allProducts.length, loading, initialCategoryId, waitForCategory]);

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
  };
}
