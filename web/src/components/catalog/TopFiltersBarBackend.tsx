'use client';

import { useMemo } from 'react';

import CategoryControl from '@/components/product/filters/CategoryControl';
import ColorFilter from '@/components/product/filters/ColorFilter';
import PriceControl from '@/components/product/filters/PriceControl';
import { SortControl } from '@/components/catalog/SortControl';
import { useCategories } from '@/contexts/CategoriesContext';
import { flattenCategoryTree } from '@/utils/categoryUtils';

interface CatalogFilters {
  search: string;
  categoryId: string;
  sortBy: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  inStock: boolean;
  page: number;
  pageSize: number;
}

type TopFiltersBarBackendProps = {
  filters: CatalogFilters;
  onChange?: (filters: Partial<CatalogFilters>) => void;
  onClear?: () => void;
};

export default function TopFiltersBarBackend({
  filters,
  onChange,
  onClear,
}: TopFiltersBarBackendProps) {
  const { categories } = useCategories();

  const categoryOptions = useMemo(() => {
    const flat = flattenCategoryTree(categories);
    return flat.map(c => ({ id: c.id, label: c.label, level: c.level }));
  }, [categories]);

  const hasActive = useMemo(() => {
    return (
      filters.categoryId.length > 0 ||
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined && filters.maxPrice < 100000) ||
      filters.colors.length > 0 ||
      filters.inStock
    );
  }, [filters]);

  // Convert backend filters to frontend format
  const frontendFilters = useMemo(
    () => ({
      categories: filters.categoryId ? [filters.categoryId] : [],
      priceRange: [filters.minPrice ?? 0, filters.maxPrice ?? 100000] as [
        number,
        number,
      ],
      colors: filters.colors,
      inStock: filters.inStock,
      sortBy: filters.sortBy,
    }),
    [filters]
  );

  const handleFiltersChange = (newFilters: any) => {
    if (!onChange) return; // Don't do anything if no onChange handler

    const updatedFilters: Partial<CatalogFilters> = {};

    if (newFilters.categories !== undefined) {
      updatedFilters.categoryId = newFilters.categories[0] || '';
    }

    if (newFilters.priceRange !== undefined) {
      updatedFilters.minPrice =
        newFilters.priceRange[0] > 0 ? newFilters.priceRange[0] : undefined;
      updatedFilters.maxPrice =
        newFilters.priceRange[1] < 100000
          ? newFilters.priceRange[1]
          : undefined;
    }

    if (newFilters.colors !== undefined) {
      updatedFilters.colors = newFilters.colors;
    }

    if (newFilters.inStock !== undefined) {
      updatedFilters.inStock = newFilters.inStock;
    }

    if (newFilters.sortBy !== undefined) {
      updatedFilters.sortBy = newFilters.sortBy;
    }

    onChange(updatedFilters);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {/* Sort control */}
      <SortControl
        value={filters.sortBy}
        onChange={sortBy => onChange && onChange({ sortBy })}
      />

      {/* Category filter */}
      <CategoryControl
        value={frontendFilters.categories}
        onChange={categories => handleFiltersChange({ categories })}
        options={categoryOptions}
        tree={categories}
      />

      {/* Price filter */}
      <PriceControl
        value={frontendFilters.priceRange}
        onChange={range => handleFiltersChange({ priceRange: range })}
      />

      {/* Color filter */}
      <ColorFilter
        value={frontendFilters.colors}
        onChange={colors => handleFiltersChange({ colors })}
      />

      {/* Clear button */}
      {hasActive && onClear && (
        <button
          onClick={() => onClear()}
          className="h-9 rounded-xl px-3 text-sm text-gray-600 hover:bg-gray-100"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
