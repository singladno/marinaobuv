import { useState } from 'react';

import type { CreateProductData } from '@/components/admin/CreateProductModal';
import type { Product } from '@/types/product';

interface UseUpdateProductReturn {
  updateProduct: (
    id: string,
    data: Partial<CreateProductData>
  ) => Promise<Product>;
  isLoading: boolean;
  error: string | null;
}

export function useUpdateProduct(): UseUpdateProductReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProduct = async (
    id: string,
    data: Partial<CreateProductData>
  ): Promise<Product> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось обновить товар');
      }

      const result = await response.json();
      return result.product;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось обновить товар';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProduct,
    isLoading,
    error,
  };
}
