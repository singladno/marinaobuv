'use client';

import { useMemo } from 'react';

import { DataTable } from '@/components/ui/DataTable';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { groupOrdersByOrder } from '@/utils/gruzchikOrderGrouping';

import { createGruzchikAvailabilityItemColumns } from './GruzchikAvailabilityItemColumns';
import { GruzchikOrderGroup } from './GruzchikOrderGroup';

export function GruzchikAvailabilityItemTable() {
  const {
    orders,
    itemRows,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    reload,
    updatingOrders,
  } = useGruzchikOrders('Наличие');

  const columns = useMemo(
    () =>
      createGruzchikAvailabilityItemColumns({
        updatingItems: updatingOrders,
      }),
    [updatingOrders]
  );

  // Group items by order
  const ordersWithItems = useMemo(
    () => groupOrdersByOrder(itemRows, orders),
    [itemRows, orders]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={reload}
          className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (ordersWithItems.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Нет заказов для управления наличием
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ordersWithItems.map(orderGroup => (
        <GruzchikOrderGroup key={orderGroup.orderId} orderGroup={orderGroup}>
          <DataTable
            data={orderGroup.items}
            columns={columns}
            loading={loading}
            error={error}
          />
        </GruzchikOrderGroup>
      ))}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <DataTablePagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
