'use client';

import React, { useState } from 'react';
import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductPriceCellProps {
  product: Product;
  priceInKopecks: number;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function ProductPriceCell({
  product,
  priceInKopecks,
  onUpdateProduct,
}: ProductPriceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formattedPrice = (priceInKopecks / 100).toFixed(2);

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, { pricePair: parseFloat(value) * 100 });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product price:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={formattedPrice}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => setIsEditing(!isEditing)}
      isSaving={isSaving}
      type="number"
      step="0.01"
    />
  );
}
