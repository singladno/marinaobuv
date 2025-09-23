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
  const pillLabel = (
    <span className="flex items-center gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="14"
        fill="none"
        viewBox="0 0 16 14"
      >
        <path
          fill="#242424"
          fillRule="evenodd"
          d="M12 .5c.406 0 .735.332.735.74v9.732l2.01-2.027a.73.73 0 0 1 1.04 0 .745.745 0 0 1 0 1.047l-3.265 3.291a.73.73 0 0 1-1.033.007l-.007-.007-3.265-3.291a.745.745 0 0 1 0-1.047.73.73 0 0 1 1.04 0l2.01 2.027V1.24c0-.41.33-.741.735-.741ZM4 13.5a.738.738 0 0 0 .735-.74V3.027l2.01 2.027a.73.73 0 0 0 1.04 0 .745.745 0 0 0 0-1.047L4.52.717a.73.73 0 0 0-1.04 0L.215 4.008a.745.745 0 0 0 0 1.047.73.73 0 0 0 1.04 0l2.01-2.027v9.731c0 .41.33.741.735.741Z"
          clipRule="evenodd"
        />
      </svg>
      <span>Сортировка</span>
    </span>
  );

  return (
    <FilterPill label={pillLabel} contentClassName="w-64 p-2">
      <div className="max-h-80 overflow-auto">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
              value === opt.value
                ? 'bg-purple-50 font-medium text-purple-700'
                : 'text-gray-800'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                value === opt.value ? 'border-purple-600' : 'border-gray-300'
              }`}
              aria-hidden="true"
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  value === opt.value ? 'bg-purple-600' : 'bg-transparent'
                }`}
              />
            </span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </FilterPill>
  );
}
