'use client';

import React, { useState } from 'react';

import { StatusSelect } from '@/components/features/StatusSelect';
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
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

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
    setStatus('saving');
    try {
      const genderMap: Record<string, string | null> = {
        Женский: 'FEMALE',
        Мужской: 'MALE',
        '-': null,
      };
      await onUpdateProduct(product.id, { gender: genderMap[value] || null });
      // Keep editing visible
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (error) {
      console.error('Error updating product gender:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StatusSelect
      value={getGenderLabel(gender)}
      options={[
        { value: 'Женский', label: 'Женский' },
        { value: 'Мужской', label: 'Мужской' },
        { value: '-', label: '-' },
      ]}
      onChange={val => handleSave(val)}
      disabled={disabled}
      status={status}
      aria-label="Пол"
    />
  );
}
