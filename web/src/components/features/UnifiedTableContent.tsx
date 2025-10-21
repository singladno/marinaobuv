import type { ColumnDef, Table } from '@tanstack/react-table';
import React from 'react';

import { DataTable } from '@/components/ui/DataTable';

interface UnifiedTableContentProps<TData, TValue> {
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

export function UnifiedTableContent<TData, TValue>({
  table,
  columns,
  data,
  loading,
  error,
  pagination,
  onPageChange,
  onPageSizeChange,
  className,
  emptyMessage,
  loadingMessage,
}: UnifiedTableContentProps<TData, TValue>) {
  const renderLoading = (message: string) => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"></div>
        <span className="text-sm text-gray-500">{message}</span>
      </div>
    </div>
  );

  const renderError = (errorMessage: string) => (
    <div className="flex flex-col items-center justify-center py-8">
      <span className="text-sm font-medium text-red-500">Ошибка загрузки</span>
      <span className="text-xs text-gray-500">{errorMessage}</span>
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="flex items-center justify-center py-8">
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );

  if (loading) {
    return renderLoading(loadingMessage || 'Загрузка...');
  }

  if (error) {
    return renderError(error);
  }

  if (!data || data.length === 0) {
    return renderEmpty(emptyMessage || 'Данные не найдены');
  }

  return (
    <DataTable
      table={table}
      columns={columns}
      data={data}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      className={className}
    />
  );
}
