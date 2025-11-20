'use client';

import React, { useState, startTransition } from 'react';

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
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

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

  const currentValue = optimisticValue ?? getGenderLabel(gender);

  const handleSave = (value: string) => {
    // Don't update if already showing this value and not saving
    if (optimisticValue === value && !isSaving) {
      return;
    }

    const previousValue = currentValue;

    // Update optimistic value with startTransition for non-blocking update
    startTransition(() => {
      setOptimisticValue(value);
    });

    // Set isSaving synchronously so status prop updates immediately
    setIsSaving(true);

    // Defer async request to next tick so UI updates immediately
    Promise.resolve().then(() => {
      const genderMap: Record<string, string | null> = {
        Женский: 'FEMALE',
        Мужской: 'MALE',
        '-': null,
      };

      onUpdateProduct(product.id, { gender: genderMap[value] || null })
        .then(() => {
          // Success - keep optimistic value
        })
        .catch(error => {
          console.error(
            '[ProductGenderCell] Error updating product gender:',
            error
          );
          // Revert on error
          setOptimisticValue(previousValue);
        })
        .finally(() => {
          // Set isSaving to false synchronously so status prop updates immediately
          setIsSaving(false);
        });
    });
  };

  return (
    <StatusSelect
      value={currentValue}
      options={[
        { value: 'Женский', label: 'Женский' },
        { value: 'Мужской', label: 'Мужской' },
        { value: '-', label: '-' },
      ]}
      onChange={val => {
        handleSave(val);
      }}
      disabled={disabled}
      status={isSaving ? 'saving' : 'idle'}
      aria-label="Пол"
    />
  );
}
