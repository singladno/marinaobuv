'use client';

import React from 'react';

import type { DraftSize } from '@/types/admin';

import { SizeRow } from './SizeRow';

interface SizeSelectorTableProps {
  sizes: DraftSize[];
  isUpdating: boolean;
  updatingSizes: Set<string>;
  disabled?: boolean;
  onSizeChange: (
    index: number,
    field: 'size' | 'quantity',
    value: string | number
  ) => void;
  onSizeBlur: (index: number) => void;
  onDeleteSize: (index: number) => void;
  onAddSize: () => void;
}

export function SizeSelectorTable({
  sizes,
  isUpdating,
  updatingSizes,
  disabled = false,
  onSizeChange,
  onSizeBlur,
  onDeleteSize,
  onAddSize,
}: SizeSelectorTableProps) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-[minmax(140px,1fr)_150px_44px] gap-3 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        <div>Размер</div>
        <div>Количество</div>
        <div></div>
      </div>

      {/* Size Rows */}
      <div className="space-y-2">
        {sizes.map((size, index) => {
          const isUpdatingThisSize = updatingSizes.has(size.id);
          return (
            <SizeRow
              key={size.id || `size-${index}`}
              size={size}
              index={index}
              isUpdating={isUpdatingThisSize}
              disabled={disabled}
              onSizeChange={onSizeChange}
              onSizeBlur={onSizeBlur}
              onDelete={onDeleteSize}
            />
          );
        })}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={onAddSize}
        disabled={disabled || isUpdating}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 ${
          isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-label="Добавить размер"
      >
        {isUpdating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            <span>Добавление...</span>
          </>
        ) : (
          <>
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Добавить размер</span>
          </>
        )}
      </button>
    </div>
  );
}
