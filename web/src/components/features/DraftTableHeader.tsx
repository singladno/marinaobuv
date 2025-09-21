import { flexRender, Table } from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';

interface DraftTableHeaderProps {
  table: Table<Draft & { selected?: boolean }>;
  headerRef?: React.RefObject<HTMLDivElement | null>;
  onHeaderScroll?: () => void;
}

export function DraftTableHeader({
  table,
  headerRef,
  onHeaderScroll,
}: DraftTableHeaderProps) {
  return (
    <div
      ref={headerRef}
      onScroll={onHeaderScroll}
      className="overflow-x-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <table className="w-full table-auto">
        <thead className="bg-gray-50 dark:bg-gray-800">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
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
      </table>
    </div>
  );
}
