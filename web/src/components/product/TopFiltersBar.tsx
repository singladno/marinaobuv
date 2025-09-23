'use client';

import { useMemo } from 'react';

import CategoryControl from '@/components/product/filters/CategoryControl';
import PriceControl from '@/components/product/filters/PriceControl';
import SortControl from '@/components/product/filters/SortControl';
import type { FilterOptions } from '@/components/product/ProductFilters';

type TopFiltersBarProps = {
  filters: FilterOptions;
  onChange: (filters: Partial<FilterOptions>) => void;
  onClear: () => void;
};

const CATEGORY_OPTIONS = [
  'Обувь',
  'Аксессуары',
  'Спорт',
  'Классика',
  'Повседневная',
];

export default function TopFiltersBar({
  filters,
  onChange,
  onClear,
}: TopFiltersBarProps) {
  const hasActive = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100000
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
        options={CATEGORY_OPTIONS}
      />

      <PriceControl
        value={filters.priceRange}
        onChange={range => onChange({ priceRange: range })}
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
