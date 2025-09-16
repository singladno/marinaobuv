import * as React from 'react';

interface DraftTableActionsProps {
  status?: string;
  selectedCount?: number;
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onReload?: () => void;
  onOpenSettings: () => void;
  showBottomBorder?: boolean;
}

export function DraftTableActions({
  status,
  selectedCount,
  onApprove,
  onConvertToCatalog,
  onReload,
  onOpenSettings,
  showBottomBorder = true,
}: DraftTableActionsProps) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 ${
        showBottomBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {status === 'approved' ? 'Одобренные товары' : 'Черновики товаров'}
        </h3>

        {/* Action buttons based on tab */}
        {status === 'draft' && (
          <button
            onClick={onApprove}
            disabled={!selectedCount}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            Одобрить выбранные ({selectedCount ?? 0})
          </button>
        )}

        {status === 'approved' && (
          <button
            onClick={onConvertToCatalog}
            disabled={!selectedCount}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
          >
            Добавить в каталог ({selectedCount ?? 0})
          </button>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Refresh button */}
        <button
          onClick={onReload}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Обновить
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Настройка колонок"
        >
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
