import { useState, useEffect, useCallback } from 'react';

import type {
  Product,
  ProductsResponse,
  ProductsFilters,
  ProductUpdateData,
} from '@/types/product';
import { useProductOperations } from './useProductOperations';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ProductsFilters;
  setFilters: (filters: Partial<ProductsFilters>) => void;
  reload: () => Promise<void>;
  reloadSilent: () => Promise<void>;
  updateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
}

export function useProducts(): UseProductsReturn {
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

  // API functions for actual server calls
  const updateProductAPI = useCallback(
    async (id: string, data: ProductUpdateData) => {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.product;
    },
    []
  );

  const deleteProductAPI = useCallback(async (id: string) => {
    const response = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }, []);

  // Use optimistic operations
  const {
    dataWithOptimisticUpdates: products,
    updateProduct: updateProductOptimistic,
    deleteProduct: deleteProductOptimistic,
    actions,
  } = useProductOperations({
    onUpdate: updateProductAPI,
    onDelete: deleteProductAPI,
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

        // Update the state manager with fresh data
        actions.setData(data.products);
        setPagination(data.pagination);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMessage);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters, actions]
  );

  const reload = useCallback(() => fetchProducts(false), [fetchProducts]);
  const reloadSilent = useCallback(() => fetchProducts(true), [fetchProducts]);

  // Use optimistic update functions
  const updateProduct = updateProductOptimistic;
  const deleteProduct = deleteProductOptimistic;

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
    products,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    reload,
    reloadSilent,
    updateProduct,
    deleteProduct,
    goToPage,
    changePageSize,
  };
}
