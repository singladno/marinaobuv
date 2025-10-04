import * as React from 'react';

import type {
  Product,
  ProductsFilters,
  ProductUpdateData,
} from '@/types/product';

import { useProductOperations } from './useProductOperations';
import { useProductsAPI } from './useProductsAPI';
import { useProductsData } from './useProductsData';

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
  const data = useProductsData();
  const api = useProductsAPI();

  // Use optimistic operations
  const {
    dataWithOptimisticUpdates: products,
    updateProduct: updateProductOptimistic,
    deleteProduct: deleteProductOptimistic,
    actions,
  } = useProductOperations({
    onUpdate: api.updateProductAPI,
    onDelete: api.deleteProductAPI,
  });

  const fetchProducts = React.useCallback(
    async (silent = false) => {
      try {
        const result = await data.fetchProducts(silent);
        // Update the state manager with fresh data
        actions.setData(result.products);
      } catch (err) {
        console.error('useProducts - fetchProducts error:', err);
        // Error is already handled in useProductsData
      }
    },
    [data.fetchProducts, actions]
  );

  const reload = async () => fetchProducts(false);
  const reloadSilent = async () => fetchProducts(true);

  // Fetch products on mount only
  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Use optimistic update functions
  const updateProduct = updateProductOptimistic;
  const deleteProduct = deleteProductOptimistic;

  return {
    products,
    loading: data.loading,
    error: data.error,
    pagination: data.pagination,
    filters: data.filters,
    setFilters: data.setFilters,
    reload,
    reloadSilent,
    updateProduct,
    deleteProduct,
    goToPage: data.goToPage,
    changePageSize: data.changePageSize,
  };
}
