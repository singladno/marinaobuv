'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import type { AdminOrder } from '@/hooks/useOrders';
import { calculateOrderProfit, formatProfit } from '@/utils/profitCalculation';

import { OrderCustomerInfo } from './OrderCustomerInfo';
import { OrderGruzchikInfo } from './OrderGruzchikInfo';
import { EditableStatusBadge } from './EditableStatusBadge';
import { EditableLabelSelector } from './EditableLabelSelector';
import { EditableGruzchikSelector } from './EditableGruzchikSelector';
import { formatOrderNumber } from '@/utils/orderNumberUtils';
import { UnreadMessageIndicator } from '@/components/ui/UnreadMessageIndicator';

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
  const router = useRouter();

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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('select') ||
      target.closest('[data-interactive="true"]')
    ) {
      return;
    }
    router.push(`/admin/orders/${order.id}`);
  };

  return (
    <tr
      className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-violet-50' : ''}`}
      onClick={handleRowClick}
    >
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
      {/* Сообщения */}
      <td className="whitespace-nowrap px-4 py-4">
        <UnreadMessageIndicator count={order.unreadMessageCount || 0} />
      </td>
      {/* Метка */}
      <td className="whitespace-nowrap px-4 py-4">
        <EditableLabelSelector
          value={order.user?.label || null}
          onLabelChange={async newLabel =>
            onPatch(order.id, { label: newLabel })
          }
        />
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
      {/* Пользователь */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {order.phone || '—'}
      </td>
      {/* Грузчик */}
      <td className="whitespace-nowrap px-4 py-4">
        <EditableGruzchikSelector
          value={order.gruzchikId}
          gruzchiks={gruzchiks || []}
          onGruzchikChange={async newGruzchikId =>
            onPatch(order.id, { gruzchikId: newGruzchikId })
          }
        />
      </td>
      {/* Прибыль */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatProfit(calculateOrderProfit(order))}
      </td>
    </tr>
  );
}
