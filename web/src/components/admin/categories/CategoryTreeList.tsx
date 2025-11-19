'use client';

import type { AdminCategoryNode } from '@/types/category';

import { CategoryTreeItem } from './CategoryTreeItem';

type Props = {
  items: AdminCategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  depth?: number;
  onCreateSubcategory?: (parentId: string) => void;
  onEdit?: (category: AdminCategoryNode) => void;
};

export function CategoryTreeList({
  items,
  selectedId,
  onSelect,
  searchTerm,
  depth = 0,
  onCreateSubcategory,
  onEdit,
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
          onCreateSubcategory={onCreateSubcategory}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
