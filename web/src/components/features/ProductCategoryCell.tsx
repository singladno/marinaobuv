'use client';

import React, { useState } from 'react';
import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductCategoryCellProps {
  product: Product;
  categories: Array<{ id: string; name: string }>;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductCategoryCell({
  product,
  categories,
  onUpdateProduct,
}: ProductCategoryCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const category = categories.find(c => c.name === value);
      if (category) {
        await onUpdateProduct(product.id, { categoryId: category.id });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating product category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={product.category.name}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => setIsEditing(!isEditing)}
      isSaving={isSaving}
      type="select"
      options={categories.map(c => ({ value: c.name, label: c.name }))}
    />
  );
}
