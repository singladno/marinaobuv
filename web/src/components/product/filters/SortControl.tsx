'use client';

import FilterPill from './FilterPill';
import type { FilterOptions } from '@/components/product/ProductFilters';

const SORT_OPTIONS = [
  { value: 'featured', label: 'По популярности' },
  { value: 'price-low', label: 'Цена: низкая' },
  { value: 'price-high', label: 'Цена: высокая' },
  { value: 'name-asc', label: 'Название: А-Я' },
  { value: 'name-desc', label: 'Название: Я-А' },
];

type Props = {
  value: FilterOptions['sortBy'];
  onChange: (value: FilterOptions['sortBy']) => void;
};

export default function SortControl({ value, onChange }: Props) {
  return (
    <FilterPill label="Сортировка" contentClassName="w-64 p-2">
      <div className="max-h-80 overflow-auto">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
              value === opt.value ? 'bg-gray-100 font-medium' : ''
            }`}
          >
            <span>{opt.label}</span>
            {value === opt.value && (
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 text-gray-700"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </FilterPill>
  );
}
