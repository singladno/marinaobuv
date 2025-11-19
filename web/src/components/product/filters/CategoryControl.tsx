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
  // When true, expand the entire tree (admin-only usage)
  forceExpandAll?: boolean;
  // When true, only allow selecting leaf categories from the tree
  selectLeavesOnly?: boolean;
};

export default function CategoryControl({
  value,
  onChange,
  options,
  tree,
  label = 'Категория',
  disabled = false,
  forceExpandAll = false,
  selectLeavesOnly = false,
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

  const leafCategoryIds = useMemo(() => {
    if (!tree || !Array.isArray(tree) || tree.length === 0) return null;

    const leaves = new Set<string>();
    const traverse = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        } else {
          leaves.add(node.id);
        }
      });
    };

    traverse(tree);
    return leaves;
  }, [tree]);

  const toggle = (id: string) => {
    if (
      selectLeavesOnly &&
      leafCategoryIds &&
      !leafCategoryIds.has(id)
    ) {
      return;
    }

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
                forceExpandAll={forceExpandAll}
                selectLeavesOnly={selectLeavesOnly}
              />
            ))
          : filtered.map(option => {
              const checked = value.includes(option.id);
              const canSelectOption =
                !selectLeavesOnly ||
                !leafCategoryIds ||
                leafCategoryIds.has(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 rounded-lg py-2 ${getIndentationClass(option.level || 0)} ${
                    canSelectOption ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed text-gray-400'
                  }`}
                  onClick={e => e.stopPropagation()}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      if (!canSelectOption) return;
                      toggle(option.id);
                    }}
                    disabled={!canSelectOption}
                  />
                  <span
                    className={`text-sm ${
                      checked
                        ? 'font-medium text-purple-700'
                        : canSelectOption
                          ? 'text-gray-800'
                          : 'text-gray-400'
                    }`}
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
