import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  article: string | null;
  pricePair: number;
  currency: string;
  primaryImageUrl: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
}

interface UseCatalogProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCatalogProducts(): UseCatalogProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // The API already returns the data in the correct format
      const transformedProducts = data.products.map(
        (product: {
          id: string;
          name: string;
          slug: string;
          article?: string | null;
          pricePair?: number;
          currency?: string;
          primaryImageUrl: string | null;
          category: { id: string; name: string } | null;
          isActive?: boolean;
          createdAt: string;
          updatedAt: string;
          colorOptions?: Array<{ color: string; imageUrl: string }>;
        }) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          article: product.article || null,
          pricePair: product.pricePair || 0,
          currency: product.currency || 'RUB',
          primaryImageUrl: product.primaryImageUrl,
          category: product.category,
          isActive: product.isActive ?? true,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          colorOptions: product.colorOptions || [],
        })
      );

      setProducts(transformedProducts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => fetchProducts(), [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    reload,
  };
}
