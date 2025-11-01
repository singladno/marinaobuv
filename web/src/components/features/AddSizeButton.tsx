'use client';

import React from 'react';

interface AddSizeButtonProps {
  isUpdating: boolean;
  disabled?: boolean;
  onAddSize: () => void;
}

export function AddSizeButton({
  isUpdating,
  disabled = false,
  onAddSize,
}: AddSizeButtonProps) {
  if (disabled) return null;

  return (
    <button
      type="button"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8 ${
        isUpdating
          ? 'cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      }`}
      onClick={onAddSize}
      disabled={isUpdating}
      aria-label="Добавить размер"
    >
      {isUpdating ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
      ) : (
        <svg
          className="h-4 w-4"
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
      )}
    </button>
  );
}
