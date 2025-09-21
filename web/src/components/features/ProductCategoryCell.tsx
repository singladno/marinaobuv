'use client';

import React, { useState } from 'react';
import {
  CategorySelector,
  type CategoryNode,
} from '@/components/ui/CategorySelector';
import type { Product } from '@/types/product';

interface ProductCategoryCellProps {
  product: Product;
  categories: CategoryNode[];
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function ProductCategoryCell({
  product,
  categories,
  onUpdateProduct,
  disabled = false,
}: ProductCategoryCellProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryChange = async (categoryId: string | null) => {
    if (disabled || isSaving) return;

    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { categoryId });
    } catch (error) {
      console.error('Error updating product category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-w-[200px]">
      <CategorySelector
        value={product.categoryId}
        onChange={handleCategoryChange}
        categories={categories}
        placeholder="Выберите категорию"
        disabled={disabled || isSaving}
      />
    </div>
  );
}
