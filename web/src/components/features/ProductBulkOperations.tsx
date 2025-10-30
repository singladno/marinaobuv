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
  return (
    <div className="flex items-center justify-between bg-blue-50 px-6 py-4 dark:bg-blue-900/20">
      <div className="flex items-center space-x-3">
        <button
          onClick={onBulkActivate}
          disabled={selectedCount === 0}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Активировать
        </button>
        <button
          onClick={onBulkDeactivate}
          disabled={selectedCount === 0}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Деактивировать
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {selectedCount > 0
            ? `Выбрано товаров: ${selectedCount}`
            : 'Выберите товары для действий'}
        </span>
        {selectedCount > 0 && (
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            Очистить выбор
          </button>
        )}
      </div>
    </div>
  );
}
