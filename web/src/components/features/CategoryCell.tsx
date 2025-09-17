import * as React from 'react';

import { CategorySelector } from '@/components/ui/CategorySelector';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

interface CategoryCellProps {
  category: Draft['category'];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  categories: CategoryNode[];
}

export function CategoryCell({
  category,
  categoryId,
  onCategoryChange,
  categories,
}: CategoryCellProps) {
  return (
    <div className="min-w-[200px]">
      <CategorySelector
        value={categoryId}
        onChange={onCategoryChange}
        categories={categories}
        placeholder="Выберите категорию"
      />
    </div>
  );
}
