import type { Table } from '@tanstack/react-table';

import { DataTableRow } from './DataTableRow';

interface DataTableContentProps<TData> {
  table: Table<TData>;
  emptyMessage?: string;
}

export function DataTableContent<TData>({
  table,
  emptyMessage = 'Данные не найдены',
}: DataTableContentProps<TData>) {
  if (table.getRowModel().rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            className="border-b border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <DataTableRow key={row.id} row={row} />
      ))}
    </tbody>
  );
}
