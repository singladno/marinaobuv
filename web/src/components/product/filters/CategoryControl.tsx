'use client';

import { useMemo, useState } from 'react';
import FilterPill from './FilterPill';
import { Checkbox } from '@/components/ui/Checkbox';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  label?: string;
};

export default function CategoryControl({
  value,
  onChange,
  options,
  label = 'Категория',
}: Props) {
  const count = value.length;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(v => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <FilterPill
      label={label}
      badgeCount={count}
      isActive={count > 0}
      onClear={() => onChange([])}
      contentClassName="w-80 p-0"
    >
      {/* Search */}
      <div className="p-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Найти в списке"
          className="h-11 w-full rounded-xl border-0 bg-gray-100 px-4 text-sm outline-none ring-0 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-300"
        />
      </div>
      <div className="max-h-80 overflow-auto p-3">
        {filtered.map(option => {
          const checked = value.includes(option);
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
              onClick={e => e.stopPropagation()}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(option)}
              />
              <span
                className={`text-sm ${checked ? 'font-medium text-purple-700' : 'text-gray-800'}`}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </FilterPill>
  );
}
