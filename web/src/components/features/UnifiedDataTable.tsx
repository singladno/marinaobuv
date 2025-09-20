'use client';

import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { DataTable } from '@/components/ui/DataTable';
import { Tabs, Tab } from '@/components/ui/Tabs';
import { useTableRenderers } from '@/hooks/useTableRenderers';

interface UnifiedDataTableProps<TData, TValue> {
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

  // Draft-specific props
  isDraftTable?: boolean;
  selected?: Record<string, boolean>;
  onToggle?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  status?: string;
  onStatusChange?: (status: string | undefined) => void;
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
  onRunAIScript?: () => void;
  selectedCount?: number;
  categories?: CategoryNode[];
  isRunningAI?: boolean;
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
  onReload?: () => void;
  onPatch?: (id: string, patch: Partial<TData>) => Promise<void>;

  // Product-specific props
  isProductTable?: boolean;
  filters?: {
    search: string;
    categoryId: string;
  };
  onFiltersChange?: (filters: { search?: string; categoryId?: string }) => void;
  onUpdateProduct?: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<void>;
}

export function UnifiedDataTable<TData, TValue>({
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

  // Draft-specific
  isDraftTable = false,
  selected,
  onToggle,
  onSelectAll,
  status,
  onStatusChange,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onRunAIScript,
  selectedCount,
  categories,
  isRunningAI,
  currentProcessingDraft,
  onReload,
  onPatch,

  // Product-specific
  isProductTable = false,
  filters,
  onFiltersChange,
  onUpdateProduct,
}: UnifiedDataTableProps<TData, TValue>) {
  const { renderDraftActions, renderProductFilters } = useTableRenderers({
    isDraftTable,
    isProductTable,
    status,
    selectedCount,
    isRunningAI,
    currentProcessingDraft,
    filters,
    onApprove,
    onConvertToCatalog,
    onBulkDelete,
    onBulkRestore,
    onBulkPermanentDelete,
    onRunAIScript,
    onReload,
    onFiltersChange,
  });

  return (
    <div
      className={`flex h-full flex-col rounded-lg bg-gray-50 dark:bg-gray-800 ${className}`}
    >
      {/* Tabs for draft table */}
      {isDraftTable && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <Tabs
            value={status ?? 'draft'}
            onChange={value => onStatusChange?.(value)}
          >
            <Tab value="draft">Черновики</Tab>
            <Tab value="approved">Одобрено</Tab>
            <Tab value="deleted">Удаленные</Tab>
          </Tabs>
        </div>
      )}

      {/* Actions for draft table */}
      {renderDraftActions()}

      {/* Filters for product table */}
      {renderProductFilters()}

      {/* Table content */}
      <div className="min-h-0 flex-1">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptyMessage={emptyMessage}
          loadingMessage={loadingMessage}
        />
      </div>
    </div>
  );
}
