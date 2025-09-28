'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
// import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
// import { useNotifications } from '@/components/ui/NotificationProvider';
import type { GruzchikOrderItemRow } from '@/hooks/useGruzchikOrders';

// Loading indicator component
function RowLoadingIndicator({ isUpdating }: { isUpdating: boolean }) {
  if (!isUpdating) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
      <div className="flex items-center space-x-2 rounded-full border bg-white px-3 py-1 shadow-lg dark:bg-gray-800">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Обновление...
        </span>
      </div>
    </div>
  );
}

// Row wrapper with loading state
function RowWrapper({
  children,
  orderId,
  updatingOrders,
}: {
  children: React.ReactNode;
  orderId: string;
  updatingOrders?: Set<string>;
}) {
  const isUpdating = updatingOrders?.has(orderId) ?? false;

  return (
    <div className="relative">
      <div
        className={`transition-opacity duration-200 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}
      >
        {children}
      </div>
      <RowLoadingIndicator isUpdating={isUpdating} />
    </div>
  );
}

export function createGruzchikPurchaseItemColumns(
  onUpdate?: (orderId: string, updates: any) => Promise<void>,
  updatingOrders?: Set<string>
): ColumnDef<GruzchikOrderItemRow>[] {
  return [
    {
      id: 'orderDate',
      header: 'Дата',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(row.original.orderDate), 'dd.MM.yyyy HH:mm', {
              locale: ru,
            })}
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'customer',
      header: 'Клиент',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {row.original.customerName || 'Не указано'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.customerPhone}
            </div>
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'item',
      header: 'Товар',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="flex items-center space-x-2">
            {row.original.itemImage && (
              <Image
                src={row.original.itemImage}
                alt={row.original.itemName}
                width={32}
                height={32}
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {row.original.itemName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {row.original.itemArticle && `Арт: ${row.original.itemArticle}`}{' '}
                • {row.original.itemQty} шт
              </div>
            </div>
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'itemCode',
      header: 'Код товара',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="text-sm">
            {row.original.itemCode ? (
              <div className="font-mono text-blue-600 dark:text-blue-400">
                {row.original.itemCode}
              </div>
            ) : (
              <div className="italic text-gray-400">Нет кода</div>
            )}
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="text-sm">
            {row.original.messageText ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  WhatsApp
                </div>
                <div className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                  {row.original.messageText}
                </div>
                {row.original.messageDate && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(row.original.messageDate), 'dd.MM HH:mm', {
                      locale: ru,
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="italic text-gray-400">Нет данных</div>
            )}
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'price',
      header: 'Цена',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.itemPrice.toLocaleString('ru-RU')} ₽
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'orderTotal',
      header: 'Сумма заказа',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.orderTotal.toLocaleString('ru-RU')} ₽
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <Badge
            variant={
              row.original.orderStatus === 'Новый'
                ? 'default'
                : row.original.orderStatus === 'Закуплен'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {row.original.orderStatus === 'Новый'
              ? 'Новый'
              : row.original.orderStatus === 'Закуплен'
                ? 'Закуплен'
                : row.original.orderStatus}
          </Badge>
        </RowWrapper>
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <RowWrapper
          orderId={row.original.orderId}
          updatingOrders={updatingOrders}
        >
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs"
              onClick={() => {
                // TODO: Implement purchase action
                console.log('Purchase order:', row.original.orderId);
              }}
            >
              Закупить
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                // TODO: Implement view details action
                console.log('View order:', row.original.orderId);
              }}
            >
              Подробнее
            </Button>
          </div>
        </RowWrapper>
      ),
    },
  ];
}
