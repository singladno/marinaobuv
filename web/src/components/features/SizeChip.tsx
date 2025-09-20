'use client';

import React from 'react';

import type { DraftSize } from '@/types/admin';

interface SizeChipProps {
  size: DraftSize;
  index: number;
  isUpdating: boolean;
  disabled?: boolean;
  onSizeChange: (
    index: number,
    field: 'size' | 'quantity',
    value: string | number
  ) => void;
  onSizeBlur: (index: number) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  chipRef: (el: HTMLDivElement | null) => void;
}

export function SizeChip({
  size,
  index,
  isUpdating,
  disabled = false,
  onSizeChange,
  onSizeBlur,
  onMouseEnter,
  onMouseLeave,
  chipRef,
}: SizeChipProps) {
  return (
    <div
      ref={chipRef}
      className={`group relative flex flex-shrink-0 flex-col items-center justify-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
        isUpdating
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50'
      }`}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
    >
      {isUpdating ? (
        // Loading state
        <div className="flex flex-col items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
          <div className="mt-1 text-xs text-blue-500">Сохранение...</div>
        </div>
      ) : (
        // Normal state
        <>
          {/* Size input */}
          <div className="flex w-8 justify-center">
            <input
              type="text"
              value={size.size || ''}
              onChange={e => onSizeChange(index, 'size', e.target.value)}
              onBlur={() => onSizeBlur(index)}
              className="w-full bg-transparent text-center text-sm font-semibold outline-none"
              placeholder="?"
              aria-label={`Размер ${index + 1}`}
              disabled={disabled}
            />
          </div>

          {/* Quantity input */}
          <div className="flex w-8 justify-center">
            <input
              type="number"
              value={size.quantity || 0}
              onChange={e =>
                onSizeChange(index, 'quantity', parseInt(e.target.value) || 0)
              }
              onBlur={() => onSizeBlur(index)}
              className="w-full bg-transparent text-center text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min="0"
              aria-label={`Количество ${index + 1}`}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
}
