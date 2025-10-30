'use client';

import React, { useState } from 'react';

import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductNameCellProps {
  product: Product;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function ProductNameCell({
  product,
  onUpdateProduct,
  disabled = false,
}: ProductNameCellProps) {
  // Always show edit control
  const [isEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { name: value });
      // Keep editing visible
    } catch (error) {
      console.error('Error updating product name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={product.name}
      onSave={handleSave}
      isEditing={isEditing}
      isSaving={isSaving}
      type="text"
      className="font-medium whitespace-normal break-words"
      disabled={disabled}
    />
  );
}
