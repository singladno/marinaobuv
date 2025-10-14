'use client';

import FilterPill from '@/components/product/filters/FilterPill';
import { Checkbox } from '@/components/ui/Checkbox';

interface SortControlProps {
  value: string;
  onChange: (value: string) => void;
}

const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'updated', label: 'По дате обновления' },
  { value: 'price_asc', label: 'По возрастанию цены' },
  { value: 'price_desc', label: 'По убыванию цены' },
];

export function SortControl({ value, onChange }: SortControlProps) {
  const currentOption =
    sortOptions.find(option => option.value === value) || sortOptions[0];

  return (
    <FilterPill
      label={currentOption.label}
      contentClassName="w-64 p-0"
      isActive={value !== 'newest'}
      onClear={() => onChange('newest')}
    >
      <div className="max-h-80 overflow-y-auto p-3">
        {sortOptions.map(option => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg py-2 hover:bg-gray-50"
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={value === option.value}
              onCheckedChange={() => onChange(option.value)}
            />
            <span
              className={`text-sm ${
                value === option.value
                  ? 'font-medium text-purple-700'
                  : 'text-gray-800'
              }`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </FilterPill>
  );
}
