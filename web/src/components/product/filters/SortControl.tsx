'use client';

import FilterPill from './FilterPill';
import { Checkbox } from '@/components/ui/Checkbox';
import type { FilterOptions } from '@/types/filters';

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
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : 'Сортировка';

  return (
    <FilterPill
      label={displayLabel}
      contentClassName="w-64 p-0"
      isActive={value !== 'featured'}
      onClear={() => onChange('featured')}
    >
      <div className="max-h-80 overflow-y-auto p-3">
        {SORT_OPTIONS.map(opt => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg py-2 hover:bg-gray-50"
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={value === opt.value}
              onCheckedChange={() => onChange(opt.value)}
            />
            <span
              className={`text-sm ${
                value === opt.value
                  ? 'font-medium text-purple-700'
                  : 'text-gray-800'
              }`}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </FilterPill>
  );
}
