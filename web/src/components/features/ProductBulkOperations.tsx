'use client';

import React from 'react';

interface ProductBulkOperationsProps {
  selectedCount: number;
  onBulkActivate: () => Promise<void>;
  onBulkDeactivate: () => Promise<void>;
  onClearSelection: () => void;
}

export function ProductBulkOperations({
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onClearSelection,
}: ProductBulkOperationsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 bg-blue-50 px-4 py-4 dark:bg-blue-900/20 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          onClick={onBulkActivate}
          disabled={selectedCount === 0}
          className="w-full rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Активировать
        </button>
        <button
          onClick={onBulkDeactivate}
          disabled={selectedCount === 0}
          className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Деактивировать
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {selectedCount > 0
            ? `Выбрано товаров: ${selectedCount}`
            : 'Выберите товары для действий'}
        </span>
        {selectedCount > 0 && (
          <button
            onClick={onClearSelection}
            className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 sm:w-auto sm:text-left"
          >
            Очистить выбор
          </button>
        )}
      </div>
    </div>
  );
}
