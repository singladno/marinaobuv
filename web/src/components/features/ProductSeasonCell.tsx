'use client';

import React, { useState, startTransition } from 'react';

import { StatusSelect } from '@/components/features/StatusSelect';
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
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

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

  const currentValue = optimisticValue ?? getSeasonLabel(season);

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
      const seasonMap: Record<string, string | null> = {
        Весна: 'SPRING',
        Лето: 'SUMMER',
        Осень: 'AUTUMN',
        Зима: 'WINTER',
        '-': null,
      };

      onUpdateProduct(product.id, { season: seasonMap[value] || null })
        .then(() => {
          // Success - keep optimistic value
        })
        .catch(error => {
          console.error(
            '[ProductSeasonCell] Error updating product season:',
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
        { value: 'Весна', label: 'Весна' },
        { value: 'Лето', label: 'Лето' },
        { value: 'Осень', label: 'Осень' },
        { value: 'Зима', label: 'Зима' },
        { value: '-', label: '-' },
      ]}
      onChange={val => {
        handleSave(val);
      }}
      disabled={disabled}
      status={isSaving ? 'saving' : 'idle'}
      aria-label="Сезон"
    />
  );
}
