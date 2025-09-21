'use client';

import type { ColumnDef, Table } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import { DataTableHeader } from './DataTableHeader';
import { DataTablePagination } from './DataTablePagination';
import { DataTableRow } from './DataTableRow';

interface DataTableProps<TData, TValue> {
  table?: Table<TData>;
  columns?: ColumnDef<TData, TValue>[];
  data?: TData[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function DataTable<TData, TValue>({
  table: providedTable,
  columns,
  data,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  className = '',
  emptyMessage = 'Данные не найдены',
  loadingMessage = 'Загрузка...',
}: DataTableProps<TData, TValue>) {
  const internalTable = useReactTable({
    data: data || [],
    columns: columns || [],
    getCoreRowModel: getCoreRowModel(),
  });

  const table = providedTable || internalTable;

  const renderContent = () => {
    if (loading) {
      const columnCount = table.getAllColumns().length;
      return (
        <tbody>
          <tr>
            <td
              colSpan={columnCount}
              className="border-b border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
            >
              <div className="flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-2">{loadingMessage}</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    if (error) {
      const columnCount = table.getAllColumns().length;
      return (
        <tbody>
          <tr>
            <td
              colSpan={columnCount}
              className="border-b border-gray-200 px-4 py-8 text-center text-red-500 dark:border-gray-700"
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium">Ошибка загрузки</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {error}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    const tableData = table.getRowModel().rows;
    if (tableData.length === 0) {
      const columnCount = table.getAllColumns().length;
      return (
        <tbody>
          <tr>
            <td
              colSpan={columnCount}
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
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <DataTableHeader table={table} />
            {renderContent()}
          </table>
        </div>
      </div>
      <DataTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
