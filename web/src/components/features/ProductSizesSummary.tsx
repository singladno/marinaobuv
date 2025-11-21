import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

type Size = { size: string; count: number };

const MAX_SUMMARY_ITEMS = 6;

type ProductSizesSummaryProps = {
  sizes: Array<Size> | null;
  canEdit?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
};

export function ProductSizesSummary({
  sizes,
  canEdit = false,
  isEditing = false,
  onToggleEdit,
}: ProductSizesSummaryProps) {
  if (!sizes || sizes.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          Размеры не указаны
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            aria-expanded={isEditing}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200 dark:hover:text-purple-300 cursor-pointer"
            title={isEditing ? 'Скрыть' : 'Добавить размеры'}
          >
            {isEditing ? (
              <XMarkIcon className="h-4 w-4" />
            ) : (
              <PencilSquareIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  const visible = sizes.slice(0, MAX_SUMMARY_ITEMS);
  const hidden = sizes.length - visible.length;

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 overflow-hidden">
      {visible.map((item, index) => (
        <span
          key={`${item.size}-${item.count}-${index}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-100"
        >
          {item.size}
          {item.count > 1 && (
            <span className="text-[10px] text-gray-500">×{item.count}</span>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <span className="shrink-0 text-xs text-gray-500">+{hidden}</span>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={onToggleEdit}
          aria-expanded={isEditing}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-gray-200 dark:hover:text-purple-300 cursor-pointer"
          title={isEditing ? 'Скрыть' : 'Редактировать размеры'}
        >
          {isEditing ? (
            <XMarkIcon className="h-4 w-4" />
          ) : (
            <PencilSquareIcon className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
