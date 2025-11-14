import type { ColumnDef, Table } from '@tanstack/react-table';
import React from 'react';

import { DataTable } from '@/components/ui/DataTable';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

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
  renderMobileCard?: (item: TData) => React.ReactNode;
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
  renderMobileCard,
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

  // Render mobile cards if renderMobileCard is provided
  if (renderMobileCard) {
    return (
      <>
        {/* Mobile Card View - shows on mobile and tablets (up to 1279px) */}
        <div className="tablet-mobile-view">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <React.Fragment key={(item as any).id || index}>
                {renderMobileCard(item)}
              </React.Fragment>
            ))}
          </div>
          {pagination && onPageChange && onPageSizeChange && (
            <DataTablePagination
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </div>

        {/* Desktop Table View - shows only on screens 1280px and wider */}
        <div className="tablet-desktop-view">
          <DataTable
            table={table}
            columns={columns}
            data={data}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            className={className}
          />
        </div>
      </>
    );
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
