'use client';

import * as React from 'react';

import { CategoryNode as CategoryNodeComponent } from './CategoryNode';
import type { CategoryNode } from './CategorySelector';

type CategoryTreeProps = {
  categories: CategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  level?: number;
  allowNonLeafSelection?: boolean;
};

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  searchTerm,
  level = 0,
  allowNonLeafSelection = false,
}: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {categories.map(category => (
        <CategoryNodeComponent
          key={category.id}
          category={category}
          selectedId={selectedId}
          onSelect={onSelect}
          searchTerm={searchTerm}
          level={level}
          allowNonLeafSelection={allowNonLeafSelection}
        />
      ))}
    </div>
  );
}
