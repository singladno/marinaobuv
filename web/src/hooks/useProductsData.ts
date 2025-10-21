import { useState, useEffect, useCallback } from 'react';

import type { ProductsResponse, ProductsFilters } from '@/types/product';

export function useProductsData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<ProductsFilters>({
    search: '',
    categoryId: '',
    page: 1,
    pageSize: 20,
  });

  const fetchProducts = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.categoryId) params.set('categoryId', filters.categoryId);
        params.set('page', String(filters.page || 1));
        params.set('pageSize', String(filters.pageSize || 20));

        const response = await fetch(`/api/admin/products?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ProductsResponse = await response.json();
        setPagination(data.pagination);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMessage);
        console.error('Error fetching products:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const reload = useCallback(() => fetchProducts(false), [fetchProducts]);
  const reloadSilent = useCallback(() => fetchProducts(true), [fetchProducts]);

  const setFilters = useCallback((newFilters: Partial<ProductsFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 when filters change
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFiltersState(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setFiltersState(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    loading,
    error,
    pagination,
    filters,
    setFilters,
    reload,
    reloadSilent,
    goToPage,
    changePageSize,
    fetchProducts,
  };
}
