'use client';

import { useMemo } from 'react';

import CategoryControl from '@/components/product/filters/CategoryControl';
import ColorFilter from '@/components/product/filters/ColorFilter';
import PriceControl from '@/components/product/filters/PriceControl';
import SortControl from '@/components/product/filters/SortControl';
import { useCategories } from '@/contexts/CategoriesContext';
import { flattenCategoryTree } from '@/utils/categoryUtils';
import type { FilterOptions } from '@/types/filters';

type TopFiltersBarProps = {
  filters: FilterOptions;
  onChange: (filters: Partial<FilterOptions>) => void;
  onClear: () => void;
};

export default function TopFiltersBar({
  filters,
  onChange,
  onClear,
}: TopFiltersBarProps) {
  const { categories } = useCategories();

  const categoryOptions = useMemo(() => {
    const flat = flattenCategoryTree(categories);
    return flat.map(c => ({ id: c.id, label: c.label, level: c.level }));
  }, [categories]);

  const hasActive = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100000 ||
      filters.colors.length > 0
    );
  }, [filters]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <SortControl
        value={filters.sortBy}
        onChange={value => onChange({ sortBy: value })}
      />

      <CategoryControl
        value={filters.categories}
        onChange={categories => onChange({ categories })}
        options={categoryOptions}
        tree={categories}
      />

      <PriceControl
        value={filters.priceRange}
        onChange={range => onChange({ priceRange: range })}
      />

      <ColorFilter
        value={filters.colors}
        onChange={colors => onChange({ colors })}
      />

      {/* Clear */}
      {hasActive && (
        <button
          onClick={onClear}
          className="h-9 rounded-xl px-3 text-sm text-gray-600 hover:bg-gray-100"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
