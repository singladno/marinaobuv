import React from 'react';
import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';

interface DataTableHeaderProps<TData> {
  table: Table<TData>;
}

export function DataTableHeader<TData>({ table }: DataTableHeaderProps<TData>) {
  return (
    <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const isFrozenLeft =
              (header.column.columnDef.meta as any)?.frozen === 'left';
            const isFrozenRight =
              (header.column.columnDef.meta as any)?.frozen === 'right';

            return (
              <th
                key={header.id}
                className={`border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
                  isFrozenLeft
                    ? 'sticky left-0 z-50 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    : isFrozenRight
                      ? 'sticky right-0 z-50 border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                      : ''
                }`}
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
