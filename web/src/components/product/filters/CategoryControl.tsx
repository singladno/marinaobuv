'use client';

import React, { useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/Checkbox';
import { getIndentationClass } from '@/utils/categoryUtils';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import { CategoryTreeNode } from './CategoryTreeNode';

import FilterPill from './FilterPill';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options: { id: string; label: string; level?: number }[]; // kept for flat list fallback
  tree?: CategoryNode[]; // preferred: pass full tree
  label?: string;
  disabled?: boolean;
};

export default function CategoryControl({
  value,
  onChange,
  options,
  tree,
  label = 'Категория',
  disabled = false,
}: Props) {
  const count = value.length;
  const [query, setQuery] = useState('');

  // Find the selected category name for display
  const selectedCategoryName = React.useMemo(() => {
    if (value.length === 0) return null;
    const selectedId = value[0]; // Get first selected category
    const findCategoryName = (
      categories: CategoryNode[],
      id: string
    ): string | null => {
      for (const category of categories) {
        if (category.id === id) return category.name;
        if (category.children) {
          const found = findCategoryName(category.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategoryName(tree || [], selectedId);
  }, [value, tree]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <FilterPill
      label={label}
      badgeCount={count}
      isActive={count > 0}
      onClear={() => onChange([])}
      contentClassName="min-w-80 max-w-96 p-0"
      disabled={disabled}
      displayName={selectedCategoryName || undefined}
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
        {/* Preferred: show collapsible tree when provided */}
        {Array.isArray(tree) && tree?.length
          ? tree.map((n: CategoryNode) => (
              <CategoryTreeNode
                key={n.id}
                node={n}
                selectedIds={value}
                onToggle={toggle}
                level={0}
                searchTerm={query}
              />
            ))
          : filtered.map(option => {
              const checked = value.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg py-2 hover:bg-gray-50 ${getIndentationClass(option.level || 0)}`}
                  onClick={e => e.stopPropagation()}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(option.id)}
                  />
                  <span
                    className={`text-sm ${checked ? 'font-medium text-purple-700' : 'text-gray-800'}`}
                  >
                    {option.label}
                  </span>
                </label>
              );
            })}
      </div>
    </FilterPill>
  );
}
