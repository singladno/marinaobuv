import { useState, useCallback } from 'react';

interface Product {
  id: string;
  slug: string;
  name: string;
  pricePair: number;
  images: Array<{ url: string; alt?: string }>;
  category: { name: string };
  article?: string;
  sizes: Array<{ size: string; count: number }>;
}

interface ProductCache {
  [slug: string]: Product;
}

export function useBasketProductCache() {
  const [cache, setCache] = useState<ProductCache>({});

  const getCachedProduct = useCallback(
    (slug: string): Product | null => {
      return cache[slug] || null;
    },
    [cache]
  );

  const setCachedProduct = useCallback((slug: string, product: Product) => {
    setCache(prev => ({
      ...prev,
      [slug]: product,
    }));
  }, []);

  const getCachedProducts = useCallback(
    (slugs: string[]): Product[] => {
      return slugs.map(slug => cache[slug]).filter(Boolean) as Product[];
    },
    [cache]
  );

  const setCachedProducts = useCallback((products: Product[]) => {
    const newCache: ProductCache = {};
    products.forEach(product => {
      newCache[product.slug] = product;
    });
    setCache(prev => ({
      ...prev,
      ...newCache,
    }));
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  return {
    getCachedProduct,
    setCachedProduct,
    getCachedProducts,
    setCachedProducts,
    clearCache,
  };
}
