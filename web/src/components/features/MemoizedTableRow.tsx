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

export const MemoizedTableRow = React.memo(
  ({ row, onToggle, currentProcessingDraft }: MemoizedTableRowProps) => {
    const isProcessing =
      currentProcessingDraft?.id === row.original.id &&
      currentProcessingDraft?.aiStatus === 'ai_processing';

    return (
      <tr
        key={row.id}
        className={`border-b border-gray-100 dark:border-gray-800 ${
          isProcessing
            ? 'pointer-events-none bg-gradient-to-r from-purple-50 to-purple-100 shadow-lg shadow-purple-200/50 dark:from-purple-900/20 dark:to-purple-800/20 dark:shadow-purple-900/20'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        style={{
          ...(isProcessing && {
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }),
        }}
      >
        {/* AI Processing Indicator - Left border */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 shadow-lg shadow-purple-400/50" />
        )}

        {/* AI Processing Badge - Top right corner */}
        {isProcessing && (
          <div className="absolute right-2 top-2 z-30">
            <div className="flex items-center space-x-1 rounded-full bg-purple-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
              <div className="h-2 w-2 animate-spin rounded-full border border-white border-t-transparent" />
              <span>AI</span>
            </div>
          </div>
        )}
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
              } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
              style={{
                ...(isFrozenLeft
                  ? { left: 0 } // Select column: 0px
                  : isFrozenRight
                    ? { right: 0 }
                    : {}),
                ...(isProcessing && {
                  backgroundColor: 'transparent',
                }),
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the row data, selection state, or processing status has changed
    const prevRow = prevProps.row.original;
    const nextRow = nextProps.row.original;

    const prevProcessingId = prevProps.currentProcessingDraft?.id;
    const nextProcessingId = nextProps.currentProcessingDraft?.id;
    const prevProcessingStatus = prevProps.currentProcessingDraft?.aiStatus;
    const nextProcessingStatus = nextProps.currentProcessingDraft?.aiStatus;

    return (
      prevRow.id === nextRow.id &&
      prevRow.selected === nextRow.selected &&
      prevProps.onToggle === nextProps.onToggle &&
      JSON.stringify(prevRow.images) === JSON.stringify(nextRow.images) &&
      JSON.stringify(prevRow.sizes) === JSON.stringify(nextRow.sizes) &&
      prevProcessingId === nextProcessingId &&
      prevProcessingStatus === nextProcessingStatus
    );
  }
);

MemoizedTableRow.displayName = 'MemoizedTableRow';
