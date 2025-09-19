import * as React from 'react';

interface DraftTableActionsProps {
  status?: string;
  selectedCount?: number;
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onReload?: () => void;
  onOpenSettings: () => void;
  showBottomBorder?: boolean;
  savingStatus?: {
    isSaving: boolean;
    message: string;
  };
}

export function DraftTableActions({
  status,
  selectedCount,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onReload,
  onOpenSettings,
  showBottomBorder = true,
  savingStatus,
}: DraftTableActionsProps) {
  return (
    <div
      className={`flex items-center justify-between bg-white px-6 py-4 dark:bg-gray-900 ${
        showBottomBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {status === 'approved' ? 'Одобренные товары' : 'Черновики товаров'}
          </h3>
        </div>

        {/* Action buttons based on tab */}
        {status === 'draft' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onApprove}
              disabled={!selectedCount}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              Одобрить выбранные ({selectedCount ?? 0})
            </button>

            {/* Bulk Delete Button - only show when items are selected */}
            {!!selectedCount && selectedCount > 0 && (
              <button
                onClick={onBulkDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                title="Удалить выбранные"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}

            {/* Saving Status Indicator */}
            {savingStatus && savingStatus.message && (
              <div
                className={`flex items-center space-x-2 rounded-lg px-3 py-1 text-sm font-medium ${
                  savingStatus.isSaving
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : savingStatus.message.includes('Ошибка')
                      ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}
              >
                {savingStatus.isSaving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <span>{savingStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {status === 'approved' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onConvertToCatalog}
              disabled={!selectedCount}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Добавить в каталог ({selectedCount ?? 0})
            </button>

            {/* Saving Status Indicator */}
            {savingStatus && savingStatus.message && (
              <div
                className={`flex items-center space-x-2 rounded-lg px-3 py-1 text-sm font-medium ${
                  savingStatus.isSaving
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : savingStatus.message.includes('Ошибка')
                      ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}
              >
                {savingStatus.isSaving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <span>{savingStatus.message}</span>
              </div>
            )}
          </div>
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
