import type { Table } from '@tanstack/react-table';

interface DataTableLoadingProps<TData> {
  table: Table<TData>;
  loadingMessage?: string;
}

export function DataTableLoading<TData>({
  table,
  loadingMessage = 'Загрузка...',
}: DataTableLoadingProps<TData>) {
  return (
    <tbody>
      <tr>
        <td
          colSpan={table.getAllColumns().length}
          className="border-b border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            {loadingMessage}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
