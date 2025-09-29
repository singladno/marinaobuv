import type { Table } from '@tanstack/react-table';

interface DataTableErrorProps<TData> {
  table: Table<TData>;
  error: string;
}

export function DataTableError<TData>({
  table,
  error,
}: DataTableErrorProps<TData>) {
  return (
    <tbody>
      <tr>
        <td
          colSpan={table.getAllColumns().length}
          className="border-b border-gray-200 px-4 py-8 text-center text-red-500 dark:border-gray-700"
        >
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 text-red-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            {error}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
