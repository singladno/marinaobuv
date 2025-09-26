'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/components/ui/NotificationProvider';
import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';

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

// Editable input components
function EditableLabel({
  order,
  onUpdate,
}: {
  order: GruzchikOrder;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState(order.label || '');
  const { addNotification } = useNotifications();

  const handleBlur = async () => {
    const trimmedValue = value.trim() || null;
    if (trimmedValue !== order.label) {
      setIsUpdating(true);
      try {
        await onUpdate(order.id, { label: trimmedValue });
        addNotification({
          type: 'success',
          title: 'Метка обновлена',
          message: 'Метка заказа успешно обновлена',
        });
      } catch (error) {
        // Reset value on error
        setValue(order.label || '');
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message:
            error instanceof Error
              ? error.message
              : 'Не удалось обновить метку',
        });
        console.error('Failed to update label:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <input
      className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      title="Метка"
      placeholder="Метка"
      value={value}
      disabled={isUpdating}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function EditablePayment({
  order,
  onUpdate,
}: {
  order: GruzchikOrder;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState(order.payment?.toString() || '0');
  const { addNotification } = useNotifications();

  const handleBlur = async () => {
    const numValue = Number(value) || 0;
    if (numValue !== (order.payment || 0)) {
      setIsUpdating(true);
      try {
        await onUpdate(order.id, { payment: numValue });
        addNotification({
          type: 'success',
          title: 'Оплата обновлена',
          message: 'Сумма оплаты успешно обновлена',
        });
      } catch (error) {
        // Reset value on error
        setValue((order.payment || 0).toString());
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message:
            error instanceof Error
              ? error.message
              : 'Не удалось обновить оплату',
        });
        console.error('Failed to update payment:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <input
      type="number"
      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      title="Оплата"
      placeholder="Оплата"
      value={value}
      disabled={isUpdating}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
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

export function createGruzchikAvailabilityColumns(
  onUpdate?: (orderId: string, updates: any) => Promise<void>,
  updatingOrders?: Set<string>
): ColumnDef<GruzchikOrder>[] {
  return [
    {
      id: 'orderNumber',
      header: '№ Заказа',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.orderNumber}
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'date',
      header: 'Дата',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(row.original.createdAt), 'dd.MM.yyyy HH:mm', {
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
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {row.original.fullName || 'Не указано'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.phone}
            </div>
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'items',
      header: 'Товары',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="space-y-1">
            {row.original.items.slice(0, 1).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.name}
                    className="h-6 w-6 rounded object-cover sm:h-8 sm:w-8"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-gray-900 sm:text-sm dark:text-white">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {item.article && `Арт: ${item.article}`} • {item.qty} шт
                  </div>
                </div>
              </div>
            ))}
            {row.original.items.length > 1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{row.original.items.length - 1} еще
              </div>
            )}
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'total',
      header: 'Сумма',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.total.toLocaleString('ru-RU')} ₽
          </div>
        </RowWrapper>
      ),
    },
    {
      id: 'label',
      header: 'Метка',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          {onUpdate ? (
            <EditableLabel order={row.original} onUpdate={onUpdate} />
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.label || '—'}
            </div>
          )}
        </RowWrapper>
      ),
    },
    {
      id: 'payment',
      header: 'Оплата',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          {onUpdate ? (
            <EditablePayment order={row.original} onUpdate={onUpdate} />
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.payment || 0} ₽
            </div>
          )}
        </RowWrapper>
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <Badge
            variant={
              row.original.status === 'Закуплен'
                ? 'default'
                : row.original.status === 'Наличие'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {row.original.status === 'Закуплен'
              ? 'Закуплен'
              : row.original.status === 'Наличие'
                ? 'В наличии'
                : row.original.status}
          </Badge>
        </RowWrapper>
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <RowWrapper orderId={row.original.id} updatingOrders={updatingOrders}>
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs"
              onClick={() => {
                // TODO: Implement availability update action
                console.log('Update availability for order:', row.original.id);
              }}
            >
              Обновить наличие
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                // TODO: Implement view details action
                console.log('View order:', row.original.id);
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
