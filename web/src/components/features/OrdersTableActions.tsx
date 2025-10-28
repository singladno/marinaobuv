'use client';

import * as React from 'react';

interface OrdersTableActionsProps {
  onReload?: () => void;
  showBottomBorder?: boolean;
}

export function OrdersTableActions({
  onReload,
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
    </div>
  );
}
