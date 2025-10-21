'use client';

import * as React from 'react';

import { TableLoader } from '@/components/ui/Loader';
import type { AdminOrder, Gruzchik } from '@/hooks/useOrders';

import { OrdersEmptyState } from './OrdersEmptyState';
import { OrdersErrorState } from './OrdersErrorState';
import { OrdersTableRow } from './OrdersTableRow';

interface OrdersTableContentProps {
  orders: AdminOrder[];
  gruzchiks: Gruzchik[];
  loading?: boolean;
  error?: string | null;
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
}

export function OrdersTableContent({
  orders,
  gruzchiks,
  loading,
  error,
  selected,
  onToggle,
  onSelectAll,
  onPatch,
}: OrdersTableContentProps) {
  const gruzchikById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const g of gruzchiks) {
      map.set(g.id, g.name || g.phone || g.id);
    }
    return map;
  }, [gruzchiks]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white transition-opacity duration-200 ease-in-out dark:bg-gray-900">
        <TableLoader message="Загрузка заказов..." />
      </div>
    );
  }

  if (error) {
    return <OrdersErrorState error={error} />;
  }

  if (orders.length === 0) {
    return <OrdersEmptyState />;
  }

  const allSelected =
    orders.length > 0 && orders.every(order => selected[order.id]);
  const someSelected = Object.values(selected).some(Boolean);

  return (
    <div className="h-full overflow-auto transition-opacity duration-200 ease-in-out">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="sticky left-0 z-30 border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={e => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                title="Выбрать все"
                aria-label="Выбрать все заказы"
              />
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Дата
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              №
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Сообщения
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Метка
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Сумма
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Оплата
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Статус
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Пользователь
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Грузчик
            </th>
            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Прибыль
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white dark:bg-gray-900">
          {orders.map(order => (
            <OrdersTableRow
              key={order.id}
              order={order}
              gruzchikById={gruzchikById}
              gruzchiks={gruzchiks}
              isSelected={selected[order.id] || false}
              onToggle={onToggle}
              onPatch={onPatch}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
