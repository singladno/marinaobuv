'use client';

import * as React from 'react';

interface OrdersTableActionsProps {
  selectedCount?: number;
  onReload?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  showBottomBorder?: boolean;
}

export function OrdersTableActions({
  selectedCount,
  onReload,
  onBulkDelete,
  onClearSelection,
  showBottomBorder = true,
}: OrdersTableActionsProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`flex items-center justify-between bg-white px-6 py-4 dark:bg-gray-900 ${
          showBottomBorder
            ? 'border-b border-gray-200 dark:border-gray-700'
            : ''
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Заказы
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <button
            onClick={onReload}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Bulk Operations - Always visible to prevent layout shift */}
      <div className="flex items-center justify-between bg-blue-50 px-6 py-4 dark:bg-blue-900/20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkDelete}
            disabled={selectedCount === 0}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Удалить
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {(selectedCount ?? 0) > 0
              ? `Выбрано заказов: ${selectedCount}`
              : 'Выберите заказы для действий'}
          </span>
          {(selectedCount ?? 0) > 0 && onClearSelection && (
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Очистить выбор
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
