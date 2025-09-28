import * as React from 'react';

import type { Draft } from '@/types/admin';

interface SizeDisplayProps {
  size: Draft['sizes'][0];
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
  index,
  isSaving,
  onEdit,
  // onDelete,
  onMouseEnter,
  onMouseLeave,
  sizeRef,
}: SizeDisplayProps) {
  return (
    <div
      key={index}
      ref={sizeRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onEdit}
      className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      title="Нажмите, чтобы редактировать"
    >
      {isSaving ? (
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700 dark:border-gray-400 dark:border-t-gray-200" />
        </span>
      ) : (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {size.size}
          </span>
          <span className="text-[10px] text-gray-600 dark:text-gray-300">
            {size.stock ?? size.count ?? 0}
          </span>
        </div>
      )}
    </div>
  );
}
