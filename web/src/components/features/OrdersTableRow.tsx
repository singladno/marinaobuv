'use client';

import * as React from 'react';

import type { AdminOrder } from '@/hooks/useOrders';

import { OrderActions } from './OrderActions';
import { OrderCustomerInfo } from './OrderCustomerInfo';
import { OrderGruzchikInfo } from './OrderGruzchikInfo';
import { StatusBadge } from './OrderStatusBadge';

interface OrdersTableRowProps {
  order: AdminOrder;
  gruzchikById: Map<string, string>;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
}

export function OrdersTableRow({
  order,
  gruzchikById,
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
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="whitespace-nowrap px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(order.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
        #{order.id.slice(-8)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <OrderCustomerInfo order={order} />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge status={order.status || 'new'} />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <OrderGruzchikInfo order={order} gruzchikById={gruzchikById} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
        {formatPrice(order.total)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <OrderActions order={order} onPatch={onPatch} />
      </td>
    </tr>
  );
}
