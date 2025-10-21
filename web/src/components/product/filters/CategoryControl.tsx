'use client';

import React, { useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/Checkbox';
import { getIndentationClass } from '@/utils/categoryUtils';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import { CategoryTreeNode } from './CategoryTreeNode';
import { useCategoryLookupContext } from '@/contexts/CategoryLookupContext';

import FilterPill from './FilterPill';

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options: {
    id: string;
    label: string;
    level?: number;
    productCount?: number;
  }[]; // kept for flat list fallback
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

  // Get the selected category ID
  const selectedCategoryId = value.length > 0 ? value[0] : null;

  // Use the efficient lookup context
  const { getCategoryName } = useCategoryLookupContext();

  // Try to get category name from local options first, then fall back to context
  const getLocalCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;

    // First try to find in local options
    const localOption = options.find(option => option.id === categoryId);
    if (localOption) {
      return localOption.label;
    }

    // Fall back to context lookup
    return getCategoryName(categoryId);
  };

  const selectedCategoryName = getLocalCategoryName(selectedCategoryId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      // If clicking the same category, deselect it
      const newValue = value.filter(v => v !== id);
      onChange(newValue);
    } else {
      // For single-select behavior: replace the current selection with the new one
      const newValue = [id];
      onChange(newValue);
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
      <div className="scrollbar-thin max-h-80 overflow-y-auto p-3">
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
                  {option.productCount !== undefined && (
                    <span className="ml-auto text-xs text-gray-500">
                      {option.productCount}
                    </span>
                  )}
                </label>
              );
            })}
      </div>
    </FilterPill>
  );
}
