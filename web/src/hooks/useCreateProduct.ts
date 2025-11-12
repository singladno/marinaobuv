import { useState } from 'react';

import type { CreateProductData } from '@/components/admin/CreateProductModal';
import type { Product } from '@/types/product';

interface UseCreateProductReturn {
  createProduct: (data: CreateProductData) => Promise<Product>;
  isLoading: boolean;
  error: string | null;
}

export function useCreateProduct(): UseCreateProductReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (data: CreateProductData): Promise<Product> => {
    setIsLoading(true);
    setError(null);

    try {
      // Exclude images from product creation - they'll be uploaded separately
      const { images, ...productData } = data;

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось создать товар');
      }

      const result = await response.json();
      return result.product;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось создать товар';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProduct,
    isLoading,
    error,
  };
}
