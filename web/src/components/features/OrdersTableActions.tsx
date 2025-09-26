'use client';

import * as React from 'react';

interface OrdersTableActionsProps {
  selectedCount?: number;
  onReload?: () => void;
  showBottomBorder?: boolean;
}

export function OrdersTableActions({
  selectedCount,
  onReload,
  showBottomBorder = true,
}: OrdersTableActionsProps) {
  return (
    <div
      className={`flex items-center justify-between bg-white px-6 py-4 dark:bg-gray-900 ${
        showBottomBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Заказы
          </h3>
          {selectedCount > 0 && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {selectedCount} выбрано
            </span>
          )}
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
  );
}
