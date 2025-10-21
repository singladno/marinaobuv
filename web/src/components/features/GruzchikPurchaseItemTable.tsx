'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/DataTable';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';

import { createGruzchikPurchaseItemColumns } from './GruzchikPurchaseItemColumns';

export function GruzchikPurchaseItemTable() {
  const {
    orders,
    itemRows,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    reload,
    updateOrderOptimistically,
    updatingOrders,
  } = useGruzchikOrders('Купить');

  const columns = useMemo(
    () =>
      createGruzchikPurchaseItemColumns({
        // adapter: expected signature is (itemId, updates) => Promise<void>
        onUpdate: async (itemId: string, updates: any) => {
          await updateOrderOptimistically(itemId, updates);
        },
        updatingItems: updatingOrders,
      }),
    [updateOrderOptimistically, updatingOrders]
  );

  // Group items by order and show only first item per order
  const ordersWithItems = useMemo(() => {
    const grouped = new Map<string, typeof itemRows>();

    itemRows.forEach(item => {
      if (!grouped.has(item.orderId)) {
        grouped.set(item.orderId, []);
      }
      grouped.get(item.orderId)!.push(item);
    });

    return Array.from(grouped.entries()).map(([orderId, items]) => {
      const order = orders.find(o => o.id === orderId);
      // Show only the first item per order (like admin panel)
      const firstItem = items[0];
      return {
        order,
        items: [firstItem], // Only show first item
        orderNumber: firstItem?.orderNumber || 'Unknown',
        orderDate: firstItem?.orderDate || '',
        customerName: firstItem?.customerName || 'Не указано',
        customerPhone: firstItem?.customerPhone || '',
        orderTotal: firstItem?.orderTotal || 0,
        orderStatus: firstItem?.orderStatus || '',
      };
    });
  }, [itemRows, orders]);

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
          Нет заказов для закупки
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ordersWithItems.map(orderGroup => (
        <div
          key={orderGroup.order?.id || orderGroup.orderNumber}
          className="space-y-4"
        >
          {/* Order Header */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Заказ #{orderGroup.orderNumber}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {format(
                      new Date(orderGroup.orderDate),
                      'dd.MM.yyyy HH:mm',
                      {
                        locale: ru,
                      }
                    )}
                  </span>
                  <span>•</span>
                  <span>{orderGroup.customerName}</span>
                  <span>•</span>
                  <span>{orderGroup.customerPhone}</span>
                  <span>•</span>
                  <span className="font-medium">
                    {orderGroup.orderTotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {orderGroup.items.length} товар
                  {orderGroup.items.length === 1
                    ? ''
                    : orderGroup.items.length < 5
                      ? 'а'
                      : 'ов'}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <DataTable
              data={orderGroup.items}
              columns={columns}
              loading={loading}
              error={error}
            />
          </div>
        </div>
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
