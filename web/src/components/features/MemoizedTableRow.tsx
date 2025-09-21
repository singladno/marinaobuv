import { flexRender } from '@tanstack/react-table';
import * as React from 'react';

interface MemoizedTableRowProps {
  row: any;
  onToggle: (id: string) => void;
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
}

export const MemoizedTableRow = ({
  row,
  onToggle,
  currentProcessingDraft,
}: MemoizedTableRowProps) => {
  const isProcessing =
    currentProcessingDraft?.id === row.original.id &&
    currentProcessingDraft?.aiStatus === 'ai_processing';

  return (
    <tr
      key={row.id}
      className={`border-b border-gray-100 dark:border-gray-800 ${
        isProcessing
          ? 'pointer-events-none'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {row.getVisibleCells().map((cell: any, index: number) => {
        const isFrozenLeft = index === 0; // First column only (select)
        const isFrozenRight = cell.column.id === 'actions'; // Last column (actions)

        return (
          <td
            key={cell.id}
            className={`whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
              cell.column.id === 'images' ? 'overflow-visible' : ''
            } ${
              isFrozenLeft
                ? 'sticky left-0 z-10 border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                : isFrozenRight
                  ? 'sticky right-0 z-10 border-l border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                  : ''
            } ${isProcessing ? 'pointer-events-none' : ''}`}
            style={{
              ...(isFrozenLeft
                ? { left: 0 } // Select column: 0px
                : isFrozenRight
                  ? { right: 0 }
                  : {}),
              ...(cell.column.columnDef.meta?.width && {
                width: cell.column.columnDef.meta.width,
                minWidth: cell.column.columnDef.meta.width,
                maxWidth: cell.column.columnDef.meta.width,
              }),
            }}
          >
            {isProcessing && isFrozenLeft ? (
              // Show AI loader in checkbox column when processing
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-1 rounded-full bg-purple-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
                  <div className="h-2 w-2 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>AI</span>
                </div>
              </div>
            ) : (
              flexRender(cell.column.columnDef.cell, {
                ...cell.getContext(),
                isProcessing,
              })
            )}
          </td>
        );
      })}
    </tr>
  );
};

MemoizedTableRow.displayName = 'MemoizedTableRow';
