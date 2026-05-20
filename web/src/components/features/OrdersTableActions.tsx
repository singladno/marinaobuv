'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';

interface OrdersTableActionsProps {
  onReload?: () => void;
  showBottomBorder?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  isBulkDeleting?: boolean;
}

export function OrdersTableActions({
  onReload,
  showBottomBorder = true,
  searchQuery = '',
  onSearchChange,
  selectedCount = 0,
  onBulkDelete,
  onClearSelection,
  isBulkDeleting = false,
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

        {selectedCount > 0 && onBulkDelete && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Выбрано: {selectedCount}
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={onBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Удалить выбранные
            </Button>
            {onClearSelection && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearSelection}
                disabled={isBulkDeleting}
              >
                Снять выделение
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
