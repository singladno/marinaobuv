'use client';

import React, { useState } from 'react';

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
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

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
    setStatus('saving');
    try {
      const seasonMap: Record<string, string | null> = {
        Весна: 'SPRING',
        Лето: 'SUMMER',
        Осень: 'AUTUMN',
        Зима: 'WINTER',
        '-': null,
      };
      await onUpdateProduct(product.id, { season: seasonMap[value] || null });
      // Keep editing visible
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (error) {
      console.error('Error updating product season:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StatusSelect
      value={getSeasonLabel(season)}
      options={[
        { value: 'Весна', label: 'Весна' },
        { value: 'Лето', label: 'Лето' },
        { value: 'Осень', label: 'Осень' },
        { value: 'Зима', label: 'Зима' },
        { value: '-', label: '-' },
      ]}
      onChange={val => handleSave(val)}
      disabled={disabled}
      status={status}
      aria-label="Сезон"
    />
  );
}
