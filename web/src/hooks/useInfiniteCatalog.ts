import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Check if there are more pages to load
  const hasNextPage = useMemo(() => {
    const hasMore = pagination.page < pagination.totalPages;
    console.log('🔍 hasNextPage calculation:', {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      hasMore,
      totalProducts: pagination.total,
      loadedProducts: allProducts.length,
    });
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
      const isInitialLoad = !append;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const currentFilters = { ...filters, ...newFilters };
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
        console.log('🔍 Fetching products from URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: CatalogResponse = await response.json();
        console.log('🔍 API Response Debug:', {
          productsReceived: data.products.length,
          pagination: data.pagination,
          append,
          currentProducts: allProducts.length,
        });

        // Log debug information from API
        if (data.debug) {
          console.log('🔍 Catalog API Debug Info:', data.debug);
        }

        if (append) {
          // Append new products to existing ones
          setAllProducts(prev => [...prev, ...data.products]);
        } else {
          // Replace all products (new search/filter)
          setAllProducts(data.products);
        }

        setPagination(data.pagination);
        setFilters(currentFilters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        if (!append) {
          setAllProducts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Load more products (for infinite scroll)
  const loadMore = useCallback(() => {
    console.log('🚀 loadMore called:', {
      hasNextPage,
      loadingMore,
      loading,
      currentPage: pagination.page,
    });
    if (hasNextPage && !loadingMore && !loading) {
      const nextPage = pagination.page + 1;
      console.log('🚀 Loading next page:', nextPage);
      fetchProducts({ page: nextPage }, true);
    }
  }, [hasNextPage, loadingMore, loading, pagination.page]);

  // Retry loading more products
  const retryLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasNextPage, loadingMore, loading, loadMore]);

  // Update filters when search query changes and fetch products
  useEffect(() => {
    if (searchQuery !== filters.search) {
      const newFilters = { ...filters, search: searchQuery, page: 1 };
      setFilters(newFilters);
      fetchProducts(newFilters, false);
    }
  }, [searchQuery]);

  // Update categoryId when initialCategoryId changes
  useEffect(() => {
    console.log(
      '🔍 useInfiniteCatalog: initialCategoryId changed:',
      initialCategoryId,
      'current categoryId:',
      filters.categoryId
    );
    if (initialCategoryId !== filters.categoryId) {
      const newFilters = {
        ...filters,
        categoryId: initialCategoryId || '',
        page: 1,
      };
      console.log(
        '🔍 useInfiniteCatalog: updating filters with categoryId:',
        newFilters.categoryId
      );
      setFilters(newFilters);
      // Call fetchProducts directly without including it in dependencies
      fetchProducts(newFilters, false);
    }
  }, [initialCategoryId]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<CatalogFilters>) => {
      const updatedFilters = { ...filters, ...newFilters, page: 1 };
      setFilters(updatedFilters);
      fetchProducts(updatedFilters, false);
    },
    [filters]
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
  }, []);

  // Load initial data
  useEffect(() => {
    fetchProducts();
  }, []);

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
