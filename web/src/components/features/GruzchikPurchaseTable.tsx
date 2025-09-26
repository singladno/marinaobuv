'use client';

import { useMemo } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { MobileDataTable } from '@/components/ui/MobileDataTable';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { createGruzchikPurchaseColumns } from './GruzchikPurchaseColumns';

export function GruzchikPurchaseTable() {
  const {
    orders,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    updateOrderOptimistically,
    updatingOrders,
  } = useGruzchikOrders('Новый');

  const columns = useMemo(
    () =>
      createGruzchikPurchaseColumns(updateOrderOptimistically, updatingOrders),
    [updateOrderOptimistically, updatingOrders]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
      <MobileDataTable
        table={table}
        columns={columns}
        data={orders}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage="Нет заказов для закупки"
        loadingMessage="Загрузка заказов..."
      />
    </div>
  );
}
