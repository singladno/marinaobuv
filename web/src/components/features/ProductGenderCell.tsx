'use client';

import React, { useState } from 'react';

import { EditableProductCell } from '@/components/features/EditableProductCell';
import type { Product } from '@/types/product';

interface ProductGenderCellProps {
  product: Product;
  gender: string | null;
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function ProductGenderCell({
  product,
  gender,
  onUpdateProduct,
  disabled = false,
}: ProductGenderCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'FEMALE':
        return 'Женский';
      case 'MALE':
        return 'Мужской';
      default:
        return '-';
    }
  };

  const handleSave = async (value: string) => {
    setIsSaving(true);
    try {
      const genderMap: Record<string, string | null> = {
        Женский: 'FEMALE',
        Мужской: 'MALE',
        '-': null,
      };
      await onUpdateProduct(product.id, { gender: genderMap[value] || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product gender:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableProductCell
      value={getGenderLabel(gender)}
      onSave={handleSave}
      isEditing={isEditing}
      onEdit={() => !disabled && setIsEditing(!isEditing)}
      onCancel={() => setIsEditing(false)}
      isSaving={isSaving}
      type="select"
      options={[
        { value: 'Женский', label: 'Женский' },
        { value: 'Мужской', label: 'Мужской' },
        { value: '-', label: '-' },
      ]}
      disabled={disabled}
    />
  );
}
