'use client';

import React, { useState } from 'react';

import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductArticleCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function ProductArticleCell({
  product,
  onUpdateProduct,
  disabled = false,
}: ProductArticleCellProps) {
  // Always show edit control
  const [isEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { article: value || null });
      // Keep editing visible
    } catch (error) {
      console.error('Error updating product article:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={product.article || ''}
      onSave={handleSave}
      isEditing={isEditing}
      isSaving={isSaving}
      type="text"
      disabled={disabled}
    />
  );
}
