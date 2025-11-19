'use client';

import React from 'react';

import type { DraftSize } from '@/types/admin';

import { QuantityControls } from './QuantityControls';

interface SizeRowProps {
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
  onDelete: (index: number) => void;
}

export function SizeRow({
  size,
  index,
  isUpdating,
  disabled = false,
  onSizeChange,
  onSizeBlur,
  onDelete,
}: SizeRowProps) {
  const inputBaseClass =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-900';

  const deleteButtonClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white text-red-600 transition-colors cursor-pointer hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-red-600 dark:border-red-700 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300';

  return (
    <div
      className={`grid grid-cols-[minmax(140px,1fr)_120px_44px] gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors dark:border-gray-700 dark:bg-gray-800 ${
        isUpdating
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
          : 'hover:border-purple-300 hover:bg-purple-50/50 dark:hover:border-purple-700 dark:hover:bg-purple-900/10'
      }`}
    >
      <div className="flex items-center">
        <input
          type="text"
          value={size.size || ''}
          onChange={e => onSizeChange(index, 'size', e.target.value)}
          onBlur={() => onSizeBlur(index)}
          className={inputBaseClass}
          placeholder="Размер"
          aria-label={`Размер ${index + 1}`}
          disabled={disabled || isUpdating}
        />
      </div>

      <QuantityControls
        value={size.quantity || 0}
        disabled={disabled || isUpdating}
        onChange={value => onSizeChange(index, 'quantity', value)}
        onBlur={() => onSizeBlur(index)}
        ariaLabel={`Количество ${index + 1}`}
      />

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onDelete(index)}
          disabled={disabled || isUpdating}
          className={deleteButtonClass}
          aria-label="Удалить размер"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
