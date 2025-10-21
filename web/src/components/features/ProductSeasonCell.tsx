'use client';

import React, { useState } from 'react';

import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductSeasonCellProps {
  product: Product;
  season: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function ProductSeasonCell({
  product,
  season,
  onUpdateProduct,
  disabled = false,
}: ProductSeasonCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getSeasonLabel = (season: string | null) => {
    switch (season) {
      case 'SPRING':
        return 'Весна';
      case 'SUMMER':
        return 'Лето';
      case 'AUTUMN':
        return 'Осень';
      case 'WINTER':
        return 'Зима';
      default:
        return '-';
    }
  };

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const seasonMap: Record<string, string | null> = {
        Весна: 'SPRING',
        Лето: 'SUMMER',
        Осень: 'AUTUMN',
        Зима: 'WINTER',
        '-': null,
      };
      await onUpdateProduct(product.id, { season: seasonMap[value] || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product season:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={getSeasonLabel(season)}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => !disabled && setIsEditing(!isEditing)}
      onCancel={() => setIsEditing(false)}
      isSaving={isSaving}
      type="select"
      options={[
        { value: 'Весна', label: 'Весна' },
        { value: 'Лето', label: 'Лето' },
        { value: 'Осень', label: 'Осень' },
        { value: 'Зима', label: 'Зима' },
        { value: '-', label: '-' },
      ]}
      disabled={disabled}
    />
  );
}
