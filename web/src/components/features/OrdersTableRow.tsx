'use client';

import * as React from 'react';

import type { AdminOrder } from '@/hooks/useOrders';
import { calculateOrderProfit, formatProfit } from '@/utils/profitCalculation';

import { OrderCustomerInfo } from './OrderCustomerInfo';
import { OrderGruzchikInfo } from './OrderGruzchikInfo';
import { EditableStatusBadge } from './EditableStatusBadge';
import { OrderEditableLabel } from './OrderEditableLabel';
import { OptimisticEditableSelect } from './OptimisticEditableSelect';
import { formatOrderNumber } from '@/utils/orderNumberUtils';

interface OrdersTableRowProps {
  order: AdminOrder;
  gruzchikById: Map<string, string>;
  gruzchiks?: { id: string; name: string | null; phone: string | null }[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
}

export function OrdersTableRow({
  order,
  gruzchikById,
  gruzchiks,
  isSelected,
  onToggle,
  onPatch,
}: OrdersTableRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-violet-50' : ''}`}>
      <td className="sticky left-0 z-10 whitespace-nowrap border-r border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(order.id)}
          aria-label="Выбрать заказ"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      {/* Дата */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </td>
      {/* № */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatOrderNumber(order.orderNumber) || `#${order.id.slice(-8)}`}
      </td>
      {/* Метка */}
      <td className="whitespace-nowrap px-4 py-4">
        <OrderEditableLabel order={order} onUpdate={onPatch} />
      </td>
      {/* Сумма */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatPrice(order.total)}
      </td>
      {/* Оплата */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
        {order.payment ? String(order.payment) : 'Не назначен'}
      </td>
      {/* Статус */}
      <td className="whitespace-nowrap px-4 py-4">
        <EditableStatusBadge
          status={order.status || 'Новый'}
          onStatusChange={async newStatus =>
            onPatch(order.id, { status: newStatus })
          }
        />
      </td>
      {/* Грузчик */}
      <td className="whitespace-nowrap px-4 py-4">
        <OptimisticEditableSelect
          value={order.gruzchikId}
          onSave={async v =>
            onPatch(order.id, { gruzchikId: v as string | null })
          }
          options={[
            { value: '', label: 'Не назначен' },
            ...(gruzchiks || []).map(g => ({
              value: g.id,
              label: g.name || g.phone || g.id,
            })),
          ]}
          placeholder="Не назначен"
          aria-label="Назначить грузчика"
        />
      </td>
      {/* Прибыль */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatProfit(calculateOrderProfit(order))}
      </td>
    </tr>
  );
}
