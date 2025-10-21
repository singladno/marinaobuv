'use client';

import type { ColumnDef, Table } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import { DataTableContent } from './DataTableContent';
import { DataTableError } from './DataTableError';
import { DataTableHeader } from './DataTableHeader';
import { DataTableLoading } from './DataTableLoading';
import { DataTablePagination } from './DataTablePagination';

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
      return <DataTableLoading table={table} loadingMessage={loadingMessage} />;
    }

    if (error) {
      return <DataTableError table={table} error={error} />;
    }

    return <DataTableContent table={table} emptyMessage={emptyMessage} />;
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
