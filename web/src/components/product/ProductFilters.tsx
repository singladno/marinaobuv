'use client';

import { useState } from 'react';

import { ActiveFilters } from '@/components/product/ActiveFilters';
import { CategoryFilter } from '@/components/product/CategoryFilter';
import { PriceFilter } from '@/components/product/PriceFilter';
import { SortFilter } from '@/components/product/SortFilter';
import { StockFilter } from '@/components/product/StockFilter';
import { Button } from '@/components/ui/Button';

export interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  inStock: boolean;
  sortBy: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

export default function ProductFilters({
  onFiltersChange,
  onClearFilters,
  className = '',
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 50000],
    minRating: 0,
    inStock: false,
    sortBy: 'featured',
  });

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updatedCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    updateFilters({ categories: updatedCategories });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    updateFilters({ priceRange: range });
  };

  const handleStockChange = (inStock: boolean) => {
    updateFilters({ inStock });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      priceRange: [0, 50000],
      minRating: 0,
      inStock: false,
      sortBy: 'featured',
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000 ||
    filters.inStock;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Фильтры</h2>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Очистить все
          </Button>
        )}
      </div>

      <CategoryFilter
        categories={['Обувь', 'Одежда', 'Аксессуары']}
        selectedCategories={filters.categories}
        onCategoryChange={handleCategoryChange}
      />

      <PriceFilter
        priceRange={filters.priceRange}
        onPriceRangeChange={handlePriceRangeChange}
      />

      <StockFilter
        inStock={filters.inStock}
        onStockChange={handleStockChange}
      />

      <SortFilter sortBy={filters.sortBy} onSortChange={handleSortChange} />

      <ActiveFilters
        categories={filters.categories}
        priceRange={filters.priceRange}
        inStock={filters.inStock}
        onCategoryChange={handleCategoryChange}
        onPriceRangeChange={handlePriceRangeChange}
        onStockChange={handleStockChange}
      />
    </div>
  );
}
