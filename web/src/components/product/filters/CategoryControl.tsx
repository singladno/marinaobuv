'use client';

import { useMemo } from 'react';
import FilterPill from './FilterPill';

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

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(v => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <FilterPill label={label} badgeCount={count} contentClassName="w-72 p-2">
      <div className="max-h-80 overflow-auto">
        {options.map(option => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
              value.includes(option) ? 'bg-gray-100 font-medium' : ''
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </FilterPill>
  );
}
