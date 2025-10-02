'use client';

import type { ColumnDef, Table } from '@tanstack/react-table';
import React from 'react';

import { UnifiedTableContent } from './UnifiedTableContent';
import { UnifiedTableHeader } from './UnifiedTableHeader';

interface UnifiedDataTableProps<TData, TValue = unknown> {
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

export function UnifiedDataTable<TData, TValue = unknown>({
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
}: UnifiedDataTableProps<TData, TValue>) {
  return (
    <div className="space-y-6">
      <UnifiedTableHeader />

      <UnifiedTableContent
        table={table}
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className={className}
        emptyMessage={emptyMessage}
        loadingMessage={loadingMessage}
      />
    </div>
  );
}
