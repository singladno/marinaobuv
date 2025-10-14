import { useState, useMemo } from 'react';

import { FilterOptions } from '@/types/filters';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';
import {
  matchesCategoryFilter,
  matchesColorFilter,
  matchesPriceRange,
  matchesRatingFilter,
  matchesSearchQuery,
  matchesStockFilter,
} from '@/utils/catalogFilters';
import { sortProducts } from '@/utils/catalogSorting';

export function useCatalogPage() {
  const { products, loading, error } = useCatalogProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 100000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
    colors: [],
  });
  const [gridCols, setGridCols] = useState<4 | 5>(4);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    // Convert products to the format expected by catalog filters
    const catalogProducts = products.map(product => ({
      id: product.id,
      slug: product.slug, // Include slug field
      name: product.name,
      article: product.article, // Include article field
      pricePair: product.pricePair,
      primaryImageUrl: product.primaryImageUrl, // Include image URL
      colorOptions: product.colorOptions || [], // Include color options
      createdAt: product.createdAt,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : undefined,
      reviews: [], // Add empty reviews array for now
      sizes: [], // No sizes property in this Product type
    }));

    const filtered = catalogProducts.filter(product => {
      return (
        matchesSearchQuery(product, searchQuery) &&
        matchesCategoryFilter(product, filters.categories) &&
        matchesPriceRange(product, filters.priceRange) &&
        matchesRatingFilter(product, filters.minRating) &&
        matchesStockFilter(product, filters.inStock) &&
        matchesColorFilter(product, filters.colors)
      );
    });

    return sortProducts(filtered, filters.sortBy);
  }, [products, searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleGridColsChange = (cols: 4 | 5) => {
    console.log('handleGridColsChange called with:', cols);
    setGridCols(cols);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 100000],
      minRating: 0,
      inStock: false,
      sortBy: 'featured',
      colors: [],
    });
    setSearchQuery('');
  };

  return {
    // State
    products: filteredProducts as any,
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
