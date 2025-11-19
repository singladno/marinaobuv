'use client';

import type { AdminCategoryNode } from '@/types/category';

import { CategoryTreeItem } from './CategoryTreeItem';

type Props = {
  items: AdminCategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  depth?: number;
};

export function CategoryTreeList({
  items,
  selectedId,
  onSelect,
  searchTerm,
  depth = 0,
}: Props) {
  return (
    <div className="space-y-1">
      {items.map(item => (
        <CategoryTreeItem
          key={item.id}
          node={item}
          depth={depth}
          selectedId={selectedId}
          onSelect={onSelect}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}
