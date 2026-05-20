'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
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
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
  onDelete?: (order: AdminOrder) => void;
  deletingOrderId?: string | null;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionDisabled?: boolean;
}

export function OrdersTableRow({
  order,
  gruzchikById,
  gruzchiks,
  onPatch,
  onDelete,
  deletingOrderId = null,
  selected = false,
  onToggleSelect,
  selectionDisabled = false,
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
      className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
      onClick={handleRowClick}
    >
      {onToggleSelect && (
        <td className="whitespace-nowrap px-4 py-4" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            data-interactive="true"
            checked={selected}
            disabled={selectionDisabled}
            onChange={() => onToggleSelect(order.id)}
            aria-label="Выбрать заказ"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
          />
        </td>
      )}
      {/* Дата */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </td>
      {/* № */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatOrderNumber(order.orderNumber) || `#${order.id.slice(-8)}`}
      </td>
      {/* Пользователь */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        <div className="space-y-1">
          {order.user?.name && (
            <div className="font-medium text-gray-900 dark:text-white">
              {order.user.name}
            </div>
          )}
          {order.user?.email && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {order.user.email}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {order.phone || '—'}
          </div>
          {order.address && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {order.address}
            </div>
          )}
        </div>
      </td>
      {/* Сообщения */}
      <td className="whitespace-nowrap px-4 py-4">
        {order.unreadMessageCount && order.unreadMessageCount > 0 ? (
          <UnreadMessageIndicator count={order.unreadMessageCount} />
        ) : null}
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
      {/* Транспорт */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {order.transportOptions && order.transportOptions.length > 0
          ? order.transportOptions.map(opt => opt.transportName).join(', ')
          : order.transportName || '—'}
      </td>
      {/* Прибыль */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {formatProfit(calculateOrderProfit(order))}
      </td>
      {onDelete && (
        <td className="sticky right-0 z-20 whitespace-nowrap border-l border-gray-200 bg-white px-4 py-4 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:group-hover:bg-gray-800/60">
          <Button
            variant="ghost"
            size="sm"
            data-interactive="true"
            onClick={e => {
              e.stopPropagation();
              onDelete(order);
            }}
            disabled={deletingOrderId === order.id}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Удалить заказ"
          >
            {deletingOrderId === order.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </td>
      )}
    </tr>
  );
}
