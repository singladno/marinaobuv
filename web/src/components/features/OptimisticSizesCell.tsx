'use client';

import React from 'react';

import { useSizesManagement } from '@/hooks/useSizesManagement';
import type { DraftSize } from '@/types/admin';

import { SizeSelectorTable } from './SizeSelectorTable';

interface OptimisticSizesCellProps {
  sizes: DraftSize[];
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

export function OptimisticSizesCell({
  sizes,
  onChange,
  disabled = false,
}: OptimisticSizesCellProps) {
  const {
    localSizes,
    isUpdating,
    updatingSizes,
    handleAddSize,
    handleDeleteSize,
    handleSizeChange,
    handleSizeBlur,
  } = useSizesManagement({ sizes, onChange, disabled });

  return (
    <SizeSelectorTable
      sizes={localSizes || []}
      isUpdating={isUpdating}
      updatingSizes={updatingSizes}
      disabled={disabled}
      onSizeChange={handleSizeChange}
      onSizeBlur={handleSizeBlur}
      onDeleteSize={handleDeleteSize}
      onAddSize={handleAddSize}
    />
  );
}
