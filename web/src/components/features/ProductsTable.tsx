'use client';

import React from 'react';

import type { Product, ProductUpdateData } from '@/types/product';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { ProductsTableContent } from './ProductsTableContent';
import { ProductsTableFilters } from './ProductsTableFilters';
import { ProductsTableHeader } from './ProductsTableHeader';

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    categoryId: string;
  };
  onFiltersChange: (filters: { search?: string; categoryId?: string }) => void;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReload: () => void;
  categories: CategoryNode[];
}

export function ProductsTable({
  products,
  loading,
  error,
  pagination,
  filters,
  onFiltersChange,
  onUpdateProduct,
  onPageChange,
  onPageSizeChange,
  onReload,
  categories,
}: ProductsTableProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <ProductsTableFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onReload={onReload}
        loading={loading}
      />

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <ProductsTableHeader />
            <ProductsTableContent
              products={products}
              loading={loading}
              error={error}
              onUpdateProduct={onUpdateProduct}
              categories={categories}
            />
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Показано {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{' '}
            из {pagination.total} товаров
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              aria-label="Количество элементов на странице"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                Назад
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} из {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
