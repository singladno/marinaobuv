import { useState, useEffect, useCallback } from 'react';

import type {
  Product,
  ProductsResponse,
  ProductsFilters,
  ProductUpdateData,
} from '@/types/product';

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
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
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

        setProducts(data.products);
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
    [filters]
  );

  const reload = useCallback(() => fetchProducts(false), [fetchProducts]);
  const reloadSilent = useCallback(() => fetchProducts(true), [fetchProducts]);

  const updateProduct = useCallback(
    async (id: string, data: ProductUpdateData) => {
      try {
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

        // Update the product in the local state
        setProducts(prev =>
          prev.map(product => (product.id === id ? result.product : product))
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update product';
        setError(errorMessage);
        console.error('Error updating product:', err);
        throw err;
      }
    },
    []
  );

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
    goToPage,
    changePageSize,
  };
}
