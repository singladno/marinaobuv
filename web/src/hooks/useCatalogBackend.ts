import { useState, useEffect, useCallback } from 'react';

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

export function useCatalogBackend() {
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
    search: searchQuery,
    categoryId: '',
    sortBy: 'newest',
    minPrice: undefined,
    maxPrice: undefined,
    colors: [],
    inStock: false,
    page: 1,
    pageSize: 20,
  });

  // Fetch products from backend
  const fetchProducts = useCallback(
    async (newFilters?: Partial<CatalogFilters>) => {
      setLoading(true);
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

        const response = await fetch(`/api/catalog?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: CatalogResponse = await response.json();
        setProducts(data.products);
        setPagination(data.pagination);
        setFilters(currentFilters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProducts([]);
      } finally {
        setLoading(false);
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

  // Load initial data
  useEffect(() => {
    fetchProducts();
  }, []);

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
  };
}
