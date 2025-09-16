import { flexRender, Table } from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';

interface DraftTableBodyProps {
  table: Table<Draft & { selected?: boolean }>;
}

export function DraftTableBody({ table }: DraftTableBodyProps) {
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();

  // Add empty rows to fill the remaining height
  // This ensures the table always takes the full available height
  const emptyRowsToAdd = Math.max(0, 15 - rows.length); // Adjust this number based on your needs

  return (
    <tbody className="bg-white dark:bg-gray-900" style={{ height: '100%' }}>
      {rows.map(row => (
        <tr
          key={row.id}
          className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
        >
          {row.getVisibleCells().map((cell, index) => {
            const isFrozenLeft = index === 0; // First column only (select)
            const isFrozenRight = cell.column.id === 'actions'; // Last column (actions)

            return (
              <td
                key={cell.id}
                className={`whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-900 dark:text-gray-100 ${
                  isFrozenLeft
                    ? 'sticky left-0 z-10 border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                    : isFrozenRight
                      ? 'sticky right-0 z-10 border-l border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                      : ''
                }`}
                style={
                  isFrozenLeft
                    ? { left: 0 } // Select column: 0px
                    : isFrozenRight
                      ? { right: 0 }
                      : {}
                }
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}

      {/* Add empty rows to fill remaining height */}
      {Array.from({ length: emptyRowsToAdd }, (_, index) => (
        <tr
          key={`empty-${index}`}
          className="border-b border-gray-100 dark:border-gray-800"
        >
          {visibleColumns.map((column, cellIndex) => {
            const isFrozenLeft = cellIndex === 0; // First column only (select)
            const isFrozenRight = column.id === 'actions'; // Last column (actions)

            return (
              <td
                key={`empty-${index}-${column.id}`}
                className={`px-4 py-3 align-middle text-sm ${
                  isFrozenLeft
                    ? 'sticky left-0 z-10 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                    : isFrozenRight
                      ? 'sticky right-0 z-10 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                      : ''
                }`}
                style={
                  isFrozenLeft ? { left: 0 } : isFrozenRight ? { right: 0 } : {}
                }
              >
                &nbsp;
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
