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

export function useInfiniteCatalog(initialCategoryId?: string) {
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

  // Check if there are more pages to load
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
      // Prevent multiple simultaneous requests
      if (loading && !append) {
        return;
      }

      const isInitialLoad = !append;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
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
      }
    },
    [loading, allProducts.length]
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
    fetchProducts(clearedFilters, false);
  }, [fetchProducts]);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery !== lastSearchQuery.current) {
      lastSearchQuery.current = searchQuery;
      const newFilters = { ...filters, search: searchQuery, page: 1 };
      setFilters(newFilters);
      fetchProducts(newFilters, false);
    }
  }, [searchQuery, fetchProducts]);

  // Handle initial category ID changes
  useEffect(() => {
    if (initialCategoryId !== lastCategoryId.current) {
      lastCategoryId.current = initialCategoryId;
      const newFilters = {
        ...filters,
        categoryId: initialCategoryId || '',
        page: 1,
      };
      setFilters(newFilters);
      fetchProducts(newFilters, false);
    }
  }, [initialCategoryId, fetchProducts]);

  // Load initial data only once
  useEffect(() => {
    if (!hasInitialized.current && allProducts.length === 0 && !loading) {
      hasInitialized.current = true;
      fetchProducts();
    }
  }, [allProducts.length, loading, fetchProducts]);

  return {
    // State
    products: allProducts,
    loading,
    loadingMore,
    error,
    pagination,
    filters,
    hasNextPage,

    // Actions
    handleFiltersChange,
    handleSortChange,
    clearFilters,
    loadMore,
    retryLoadMore,
    fetchProducts,
  };
}
