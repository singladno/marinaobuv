import * as React from 'react';

interface ImageModalHeaderProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkSplit: () => void;
  isBulkDeleting: boolean;
  isBulkSplitting: boolean;
  hasBulkDelete: boolean;
  hasBulkSplit: boolean;
}

export function ImageModalHeader({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkSplit,
  isBulkDeleting,
  isBulkSplitting,
  hasBulkDelete,
  hasBulkSplit,
}: ImageModalHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span>Просмотр изображений</span>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Выбрано: {selectedCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onSelectAll}
              className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              Выбрать все
            </button>
            <button
              onClick={onDeselectAll}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Снять выбор
            </button>
            {hasBulkSplit && (
              <button
                onClick={onBulkSplit}
                disabled={isBulkSplitting}
                className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isBulkSplitting ? 'Разделение...' : 'Разделить продукт'}
              </button>
            )}
            {hasBulkDelete && (
              <button
                onClick={onBulkDelete}
                disabled={isBulkDeleting}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isBulkDeleting ? 'Удаление...' : 'Удалить выбранные'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
