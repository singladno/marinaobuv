'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-[180px] rounded-xl bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
