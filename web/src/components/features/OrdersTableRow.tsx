'use client';

import * as React from 'react';

import type { AdminOrder } from '@/hooks/useOrders';

interface OrdersTableRowProps {
  order: AdminOrder;
  gruzchikById: Map<string, string>;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'new'
      ? 'bg-gray-100 text-gray-800'
      : status === 'Наличие'
        ? 'bg-blue-100 text-blue-800'
        : status === 'Купить'
          ? 'bg-amber-100 text-amber-800'
          : status === 'Согласование'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${color}`}>{status}</span>
  );
}

export function OrdersTableRow({
  order,
  gruzchikById,
  isSelected,
  onToggle,
  onPatch,
}: OrdersTableRowProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = React.useCallback(
    async (patch: Partial<AdminOrder>) => {
      setIsUpdating(true);
      try {
        await onPatch(order.id, patch);
      } finally {
        setIsUpdating(false);
      }
    },
    [order.id, onPatch]
  );

  const profit = Number(order.total) - Number(order.payment || 0);

  return (
    <tr
      className={`text-sm ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      {/* Select checkbox */}
      <td className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(order.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          title="Выбрать заказ"
          aria-label={`Выбрать заказ ${order.orderNumber}`}
        />
      </td>

      {/* Date */}
      <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-gray-900 dark:border-gray-700 dark:text-gray-100">
        {new Date(order.createdAt).toLocaleString()}
      </td>

      {/* Order Number */}
      <td className="border-b border-gray-200 px-4 py-3 text-gray-900 dark:border-gray-700 dark:text-gray-100">
        {order.orderNumber}
      </td>

      {/* Label */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          title="Метка"
          placeholder="Метка"
          defaultValue={order.label || ''}
          disabled={isUpdating}
          onBlur={async e => {
            const val = e.currentTarget.value.trim() || null;
            if (val !== order.label) {
              await handleUpdate({ label: val });
            }
          }}
        />
      </td>

      {/* Amount */}
      <td className="border-b border-gray-200 px-4 py-3 text-gray-900 dark:border-gray-700 dark:text-gray-100">
        {Number(order.total)} р.
      </td>

      {/* Payment */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          type="number"
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          title="Оплата"
          placeholder="Оплата"
          defaultValue={order.payment || 0}
          disabled={isUpdating}
          onBlur={async e => {
            const val = Number(e.currentTarget.value || 0);
            if (val !== Number(order.payment || 0)) {
              await handleUpdate({ payment: val });
            }
          }}
        />
      </td>

      {/* Status */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <StatusBadge status={order.status} />
      </td>

      {/* Gruzchik */}
      <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <select
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          title="Грузчик"
          value={order.gruzchikId || ''}
          disabled={isUpdating}
          onChange={async e => {
            const val = e.currentTarget.value || null;
            if (val !== order.gruzchikId) {
              await handleUpdate({ gruzchikId: val });
            }
          }}
        >
          <option value="">—</option>
          {Array.from(gruzchikById.entries()).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </td>

      {/* Profit */}
      <td className="border-b border-gray-200 px-4 py-3 text-gray-900 dark:border-gray-700 dark:text-gray-100">
        {profit} р.
      </td>

      {/* Actions */}
      <td className="sticky right-0 z-20 border-b border-l border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex gap-2">
          <button
            className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={isUpdating}
            onClick={() => handleUpdate({ status: 'Наличие' })}
          >
            Наличие
          </button>
          <button
            className="rounded bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50"
            disabled={isUpdating}
            onClick={() => handleUpdate({ status: 'Купить' })}
          >
            Купить
          </button>
          <button
            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
            disabled={isUpdating}
            onClick={() => handleUpdate({ status: 'Согласование' })}
          >
            Согласование
          </button>
        </div>
      </td>
    </tr>
  );
}
