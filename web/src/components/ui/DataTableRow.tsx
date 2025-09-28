import { flexRender } from '@tanstack/react-table';
import type { Row } from '@tanstack/react-table';
import React from 'react';

interface ColumnMeta {
  frozen?: 'left' | 'right';
  getRowClass?: (row: Row<any>) => string;
}

interface RowData {
  id?: string;
}

interface DataTableRowProps<TData> {
  row: Row<TData>;
}

export function DataTableRow<TData>({ row }: DataTableRowProps<TData>) {
  // Extract product ID from row data for data-product-id attribute
  const productId = (row.original as RowData)?.id;

  // Get custom row class from first column meta if available
  const firstColumn = row.getVisibleCells()[0]?.column;
  const meta = firstColumn?.columnDef?.meta as ColumnMeta;
  const getRowClass = meta?.getRowClass;
  const customRowClass = getRowClass ? getRowClass(row) : '';

  return (
    <tr
      key={row.id}
      data-product-id={productId}
      className={`border-b border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 ${customRowClass}`}
    >
      {row.getVisibleCells().map(cell => {
        const cellMeta = cell.column.columnDef.meta as ColumnMeta;
        const isFrozenLeft = cellMeta?.frozen === 'left';
        const isFrozenRight = cellMeta?.frozen === 'right';

        return (
          <td
            key={cell.id}
            className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
              isFrozenLeft
                ? 'sticky left-0 z-10 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                : isFrozenRight
                  ? 'sticky right-0 z-10 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                  : ''
            }`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}
