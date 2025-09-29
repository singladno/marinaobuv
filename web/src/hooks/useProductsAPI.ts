import { useCallback } from 'react';

import type { ProductUpdateData } from '@/types/product';

export function useProductsAPI() {
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

  return {
    updateProductAPI,
    deleteProductAPI,
  };
}
