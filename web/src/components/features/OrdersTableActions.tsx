'use client';

import * as React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';

interface OrdersTableActionsProps {
  onReload?: () => void;
  showBottomBorder?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function OrdersTableActions({
  onReload,
  showBottomBorder = true,
  searchQuery = '',
  onSearchChange,
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Заказы
          </h3>
          {onSearchChange && (
            <div className="w-full sm:w-80">
              <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Поиск по номеру, имени, email, телефону..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
