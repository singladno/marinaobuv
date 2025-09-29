'use client';

import type { ColumnDef, Table } from '@tanstack/react-table';
import React, { useState } from 'react';

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

  onReload: () => void;
  onColumnSettings: () => void;
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
  onReload,
  onColumnSettings,
}: UnifiedDataTableProps<TData, TValue>) {
  const [activeTab, setActiveTab] = useState('drafts');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <UnifiedTableHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReload={onReload}
        onColumnSettings={onColumnSettings}
      />

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
