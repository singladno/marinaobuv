import { flexRender } from '@tanstack/react-table';
import * as React from 'react';

interface MemoizedTableRowProps {
  row: any;
  onToggle: (id: string) => void;
}

export const MemoizedTableRow = React.memo(
  ({ row, onToggle }: MemoizedTableRowProps) => {
    return (
      <tr
        key={row.id}
        className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
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
              }`}
              style={{
                ...(isFrozenLeft
                  ? { left: 0 } // Select column: 0px
                  : isFrozenRight
                    ? { right: 0 }
                    : {}),
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
    // Only re-render if the row data or selection state has changed
    const prevRow = prevProps.row.original;
    const nextRow = nextProps.row.original;

    return (
      prevRow.id === nextRow.id &&
      prevRow.selected === nextRow.selected &&
      prevProps.onToggle === nextProps.onToggle
    );
  }
);

MemoizedTableRow.displayName = 'MemoizedTableRow';
