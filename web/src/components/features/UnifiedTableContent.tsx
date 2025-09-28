import type { ColumnDef, Table } from '@tanstack/react-table';
import React from 'react';

import { DataTable } from '@/components/ui/DataTable';
import { useTableRenderers } from '@/hooks/useTableRenderers';

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
  const { renderLoading, renderError, renderEmpty } = useTableRenderers();

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
