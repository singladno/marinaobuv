import { flexRender } from '@tanstack/react-table';
import * as React from 'react';

import { TableLoader } from '@/components/ui/Loader';
// import type { Draft } from '@/types/admin';

import { DraftEmptyState } from './DraftEmptyState';
import { DraftErrorState } from './DraftErrorState';
import { MemoizedTableRow } from './MemoizedTableRow';

interface DraftTableContentProps {
  table: any; // Table from react-table
  loading?: boolean;
  error?: string | null;
  status?: string;
  hasData: boolean;
  savingStatus?: {
    isSaving: boolean;
    message: string;
  };
  onToggle?: (id: string) => void;
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
}

export function DraftTableContent({
  table,
  loading,
  error,
  status,
  hasData,
  // savingStatus,
  onToggle,
  currentProcessingDraft,
}: DraftTableContentProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white transition-opacity duration-200 ease-in-out dark:bg-gray-900">
        <TableLoader message="Загрузка данных..." />
      </div>
    );
  }

  if (error) {
    return <DraftErrorState error={error} />;
  }

  if (!hasData) {
    return <DraftEmptyState status={status} />;
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="h-full overflow-auto transition-opacity duration-200 ease-in-out">
      <table className="w-full table-auto">
        {/* Header */}
        <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any, index: number) => {
                const isFrozenLeft = index === 0; // First column only (select)
                const isFrozenRight = header.column.id === 'actions'; // Last column (actions)

                return (
                  <th
                    key={header.id}
                    className={`whitespace-nowrap border-b border-gray-200 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
                      header.column.id === 'material' ||
                      header.column.id === 'gender'
                        ? 'text-center'
                        : 'text-left'
                    } ${
                      isFrozenLeft
                        ? 'sticky left-0 z-30 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        : isFrozenRight
                          ? 'sticky right-0 z-30 border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                          : 'relative z-20'
                    }`}
                    style={{
                      ...(isFrozenLeft
                        ? { left: 0 } // Select column: 0px
                        : isFrozenRight
                          ? { right: 0 }
                          : {}),
                      ...(header.column.columnDef.meta?.width && {
                        width: header.column.columnDef.meta.width,
                        minWidth: header.column.columnDef.meta.width,
                        maxWidth: header.column.columnDef.meta.width,
                      }),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* Body */}
        <tbody className="bg-white dark:bg-gray-900">
          {rows.map((row: any) => (
            <MemoizedTableRow
              key={row.id}
              row={row}
              onToggle={onToggle || (() => {})}
              currentProcessingDraft={currentProcessingDraft}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
