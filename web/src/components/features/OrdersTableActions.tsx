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
        className={`bg-white px-4 py-5 dark:bg-gray-900 sm:px-6 ${
          showBottomBorder
            ? 'border-b border-gray-200 dark:border-gray-700'
            : ''
        }`}
      >
        <div className="flex items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Заказы
          </h3>
        </div>
      </div>
    </div>
  );
}
