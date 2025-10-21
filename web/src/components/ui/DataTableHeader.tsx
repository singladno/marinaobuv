import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import React from 'react';

interface ColumnMeta {
  frozen?: 'left' | 'right';
}

interface DataTableHeaderProps<TData> {
  table: Table<TData>;
}

export function DataTableHeader<TData>({ table }: DataTableHeaderProps<TData>) {
  return (
    <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header, index) => {
            const isFrozenLeft = index === 0; // First column only (select)
            const isFrozenRight = header.column.id === 'actions'; // Last column (actions)

            return (
              <th
                key={header.id}
                className={`whitespace-nowrap border-b border-gray-200 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
                  isFrozenLeft
                    ? 'sticky left-0 z-30 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    : isFrozenRight
                      ? 'sticky right-0 z-30 border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                      : 'relative z-20'
                }`}
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  ...(isFrozenLeft
                    ? { left: 0 } // Select column: 0px
                    : isFrozenRight
                      ? { right: 0 }
                      : {}),
                  ...((header.column.columnDef.meta as any)?.width && {
                    width: (header.column.columnDef.meta as any).width,
                    minWidth: (header.column.columnDef.meta as any).width,
                    maxWidth: (header.column.columnDef.meta as any).width,
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
  );
}
