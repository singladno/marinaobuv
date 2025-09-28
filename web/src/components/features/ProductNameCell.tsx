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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { name: value });
      setIsEditing(false);
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
      onEdit={() => !disabled && setIsEditing(!isEditing)}
      isSaving={isSaving}
      type="text"
      className="font-medium"
      disabled={disabled}
    />
  );
}
