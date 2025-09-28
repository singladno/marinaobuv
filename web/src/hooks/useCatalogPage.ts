import { useState, useMemo } from 'react';

import { FilterOptions } from '@/components/product/ProductFilters';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

interface Product {
  id: string;
  name: string;
  pricePair: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  reviews?: Array<{
    rating: number;
  }>;
  sizes?: Array<{
    stock: number;
  }>;
}

// Helper functions for filtering
const matchesSearchQuery = (product: Product, query: string) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(lowerQuery) ||
    product.category?.name?.toLowerCase()?.includes(lowerQuery)
  );
};

const matchesCategoryFilter = (product: Product, categories: string[]) => {
  if (categories.length === 0) return true;
  return product.category && categories.includes(product.category.id);
};

const matchesPriceRange = (product: Product, priceRange: [number, number]) => {
  return (
    product.pricePair >= priceRange[0] && product.pricePair <= priceRange[1]
  );
};

const matchesRatingFilter = (product: Product, minRating: number) => {
  if (minRating === 0) return true;
  const avgRating =
    product.reviews?.length > 0
      ? product.reviews.reduce(
          (sum: number, review: { rating: number }) => sum + review.rating,
          0
        ) / product.reviews.length
      : 0;
  return avgRating >= minRating;
};

const matchesStockFilter = (product: Product, inStock: boolean) => {
  if (!inStock) return true;
  return (
    product.sizes?.some((size: { stock: number }) => size.stock > 0) || false
  );
};

const sortProducts = (products: Product[], sortBy: string) => {
  switch (sortBy) {
    case 'price-low':
      return products.sort((a, b) => a.pricePair - b.pricePair);
    case 'price-high':
      return products.sort((a, b) => b.pricePair - a.pricePair);
    case 'name':
      return products.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
      return products.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'rating':
      return products.sort((a, b) => {
        const aRating =
          a.reviews?.length > 0
            ? a.reviews.reduce(
                (sum: number, review: { rating: number }) =>
                  sum + review.rating,
                0
              ) / a.reviews.length
            : 0;
        const bRating =
          b.reviews?.length > 0
            ? b.reviews.reduce(
                (sum: number, review: { rating: number }) =>
                  sum + review.rating,
                0
              ) / b.reviews.length
            : 0;
        return bRating - aRating;
      });
    default:
      return products;
  }
};

export function useCatalogPage() {
  const { products, loading, error } = useCatalogProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 100000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
  });
  const [gridCols, setGridCols] = useState<4 | 5>(4);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const filtered = products.filter(product => {
      return (
        matchesSearchQuery(product, searchQuery) &&
        matchesCategoryFilter(product, filters.categories) &&
        matchesPriceRange(product, filters.priceRange) &&
        matchesRatingFilter(product, filters.minRating) &&
        matchesStockFilter(product, filters.inStock)
      );
    });

    return sortProducts(filtered, filters.sortBy);
  }, [products, searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleGridColsChange = (cols: 4 | 5) => {
    setGridCols(cols);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 100000],
      minRating: 0,
      inStock: false,
      sortBy: 'featured',
    });
    setSearchQuery('');
  };

  return {
    // State
    products: filteredProducts,
    loading,
    error,
    searchQuery,
    filters,
    gridCols,

    // Actions
    handleSearch,
    handleFiltersChange,
    handleGridColsChange,
    clearFilters,
  };
}
