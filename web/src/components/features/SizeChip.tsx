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
      className={`group relative flex shrink flex-col items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all sm:px-2 sm:py-1 sm:text-xs ${
        isUpdating
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50'
      }`}
      style={{
        minWidth: 0,
        flexBasis: 'auto',
      }}
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
          <div className="flex min-w-0 justify-center">
            <input
              type="text"
              value={size.size || ''}
              onChange={e => onSizeChange(index, 'size', e.target.value)}
              onBlur={() => onSizeBlur(index)}
              className="w-5 bg-transparent text-center text-[11px] font-semibold outline-none sm:w-6 sm:text-xs"
              placeholder="?"
              aria-label={`Размер ${index + 1}`}
              disabled={disabled}
            />
          </div>

          {/* Quantity input */}
          <div className="flex min-w-0 justify-center">
            <input
              type="number"
              value={size.quantity || 0}
              onChange={e =>
                onSizeChange(index, 'quantity', parseInt(e.target.value) || 0)
              }
              onBlur={() => onSizeBlur(index)}
              className="w-5 bg-transparent text-center text-[9px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:w-6 sm:text-[10px]"
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
