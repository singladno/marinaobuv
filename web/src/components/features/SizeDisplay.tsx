import * as React from 'react';

import type { Draft } from '@/types/admin';

interface SizeDisplayProps {
  size: NonNullable<Draft['sizes']>[0];
  index: number;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  sizeRef: (el: HTMLDivElement | null) => void;
}

export function SizeDisplay({
  size,
  isSaving,
  onEdit,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  sizeRef,
}: SizeDisplayProps) {
  return (
    <div
      ref={sizeRef}
      className="group relative flex-shrink-0 rounded border bg-white px-2 py-1 text-sm shadow-sm transition-all hover:shadow-md dark:bg-gray-800"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-1">
        <span className="font-medium">{size.size}</span>
        {(size.count || size.quantity || 0) > 1 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
            {size.count || size.quantity || 0}
          </span>
        )}
      </div>

      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-blue-700" />
        </div>
      )}

      <div className="absolute -right-1 -top-1 hidden group-hover:block">
        <button
          onClick={onEdit}
          className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          type="button"
          title="Редактировать размер"
        >
          ✏️
        </button>
      </div>

      <div className="absolute -bottom-1 -right-1 hidden group-hover:block">
        <button
          onClick={onDelete}
          className="rounded bg-red-100 px-1 py-0.5 text-xs text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
          type="button"
          title="Удалить размер"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
