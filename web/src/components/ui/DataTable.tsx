'use client';

import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { ColumnDef } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
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
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderPagination = () => {
    if (!pagination || !onPageChange || !onPageSizeChange) return null;

    const { page, pageSize, total, totalPages } = pagination;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Показано {startItem}-{endItem} из {total}
          </span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Размер страницы"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            Назад
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            Вперед
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
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
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
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

    if (data.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
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
        {table.getRowModel().rows.map(row => {
          // Extract product ID from row data for data-product-id attribute
          const productId = (row.original as any)?.id;
          return (
            <tr
              key={row.id}
              data-product-id={productId}
              className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {row.getVisibleCells().map(cell => {
                const isFrozenLeft =
                  cell.column.columnDef.meta?.frozen === 'left';
                const isFrozenRight =
                  cell.column.columnDef.meta?.frozen === 'right';

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
        })}
      </tbody>
    );
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isFrozenLeft =
                      header.column.columnDef.meta?.frozen === 'left';
                    const isFrozenRight =
                      header.column.columnDef.meta?.frozen === 'right';

                    return (
                      <th
                        key={header.id}
                        className={`border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
                          isFrozenLeft
                            ? 'sticky left-0 z-40 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                            : isFrozenRight
                              ? 'sticky right-0 z-40 border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
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
            {renderContent()}
          </table>
        </div>
      </div>
      {renderPagination()}
    </div>
  );
}
