import * as React from 'react';

import { CategorySelector } from '@/components/ui/CategorySelector';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

interface CategoryCellProps {
  category: Draft['category'];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  categories: CategoryNode[];
  disabled?: boolean;
}

export function CategoryCell({
  // category,
  categoryId,
  onCategoryChange,
  categories,
  disabled = false,
}: CategoryCellProps) {
  return (
    <div
      className={`min-w-[200px] ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <CategorySelector
        value={categoryId}
        onChange={onCategoryChange}
        categories={categories}
        placeholder="Выберите категорию"
        disabled={disabled}
      />
    </div>
  );
}
