'use client';

import { useMemo } from 'react';

import CategoryControl from '@/components/product/filters/CategoryControl';
import { useAllCategories } from '@/hooks/useAllCategories';
import { flattenCategoryTree } from '@/utils/categoryUtils';
import type { ProductsFilters } from '@/types/product';

interface ProductFiltersProps {
  filters: ProductsFilters;
  onFiltersChange: (filters: Partial<ProductsFilters>) => void;
}

export function ProductFilters({
  filters,
  onFiltersChange,
}: ProductFiltersProps) {
  const { categories } = useAllCategories();

  const categoryOptions = useMemo(() => {
    const flat = flattenCategoryTree(categories);
    return flat.map(c => ({ id: c.id, label: c.label, level: c.level }));
  }, [categories]);

  const handleCategoryChange = (categoryIds: string[]) => {
    // For admin, we'll use the first selected category as the main filter
    // This matches the current API expectation of a single categoryId
    onFiltersChange({
      categoryId: categoryIds.length > 0 ? categoryIds[0] : '',
      page: 1, // Reset to first page when filters change
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({
      search,
      page: 1, // Reset to first page when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categoryId: '',
      page: 1,
    });
  };

  const hasActiveFilters = filters.search || filters.categoryId;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="min-w-64 flex-1">
        <input
          type="text"
          placeholder="Поиск по названию товара..."
          value={filters.search || ''}
          onChange={e => handleSearchChange(e.target.value)}
          className="h-9 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Category Filter */}
      <CategoryControl
        value={filters.categoryId ? [filters.categoryId] : []}
        onChange={handleCategoryChange}
        options={categoryOptions}
        tree={categories}
        label="Категория"
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="h-9 rounded-xl px-3 text-sm text-gray-600 hover:bg-gray-100"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
