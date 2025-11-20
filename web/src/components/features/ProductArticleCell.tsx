'use client';

import React, { useState } from 'react';
import { flushSync } from 'react-dom';

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
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

  const currentValue = optimisticValue ?? (product.article || '');

  const handleSave = (value: string) => {
    // Don't update if already showing this value and not saving
    if (optimisticValue === value && !isSaving) {
      return;
    }

    const previousValue = currentValue;

    // CRITICAL: Set state IMMEDIATELY and flush synchronously to ensure UI updates
    flushSync(() => {
      setOptimisticValue(value);
      setIsSaving(true);
    });

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      onUpdateProduct(product.id, { article: value || null })
        .then(() => {
          // Success - keep optimistic value
        })
        .catch((error) => {
          console.error('[ProductArticleCell] Error updating product article:', error);
          // Revert on error
          setOptimisticValue(previousValue);
        })
        .finally(() => {
          setIsSaving(false);
        });
    });
  };

  return (
    <EditableProductCell
      value={currentValue}
      onSave={handleSave}
      isEditing={isEditing}
      isSaving={isSaving}
      type="text"
      disabled={disabled}
    />
  );
}
