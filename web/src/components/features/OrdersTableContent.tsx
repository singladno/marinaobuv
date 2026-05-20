'use client';

import * as React from 'react';

import { TableLoader } from '@/components/ui/Loader';
import type { AdminOrder, Gruzchik } from '@/hooks/useOrders';
import { UnreadMessageIndicator } from '@/components/ui/UnreadMessageIndicator';
import { EditableStatusBadge } from './EditableStatusBadge';
import { EditableLabelSelector } from './EditableLabelSelector';
import { EditableGruzchikSelector } from './EditableGruzchikSelector';
import { calculateOrderProfit, formatProfit } from '@/utils/profitCalculation';
import { formatOrderNumber } from '@/utils/orderNumberUtils';

import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

import { OrdersEmptyState } from './OrdersEmptyState';
import { OrdersErrorState } from './OrdersErrorState';
import { OrdersTableRow } from './OrdersTableRow';

interface OrdersTableContentProps {
  orders: AdminOrder[];
  gruzchiks: Gruzchik[];
  loading?: boolean;
  error?: string | null;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
  onDelete?: (order: AdminOrder) => void;
  deletingOrderId?: string | null;
  isSearchResult?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  selectionDisabled?: boolean;
}

export function OrdersTableContent({
  orders,
  gruzchiks,
  loading,
  error,
  onPatch,
  onDelete,
  deletingOrderId = null,
  isSearchResult = false,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  allSelected = false,
  someSelected = false,
  selectionDisabled = false,
}: OrdersTableContentProps) {
  const showSelection = !!onToggleSelect && !!selectedIds;
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
    return <OrdersEmptyState isSearchResult={isSearchResult} />;
  }

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
    <div className="h-full overflow-auto transition-opacity duration-200 ease-in-out">
      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map(order => {
            const profit = calculateOrderProfit(order);
            const displayOrderNumber = order.orderNumber
              ? `#${formatOrderNumber(order.orderNumber)}`
              : `#${order.id.slice(-8)}`;
            return (
              <div
                key={order.id}
                onClick={e => {
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
                  window.location.href = `/admin/orders/${order.id}`;
                }}
                className="cursor-pointer bg-white px-4 py-5 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="space-y-4">
                  {/* Header: Order number, status, date */}
                  <div className="flex items-start justify-between gap-2">
                    {showSelection && (
                      <input
                        type="checkbox"
                        data-interactive="true"
                        checked={selectedIds.has(order.id)}
                        disabled={selectionDisabled}
                        onChange={() => onToggleSelect(order.id)}
                        aria-label={`Выбрать заказ ${displayOrderNumber}`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-base font-bold text-gray-900 dark:text-white">
                          {displayOrderNumber}
                        </h4>
                        <EditableStatusBadge
                          status={order.status || 'Новый'}
                          onStatusChange={async newStatus =>
                            onPatch(order.id, { status: newStatus })
                          }
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {(order.unreadMessageCount ?? 0) > 0 && (
                        <UnreadMessageIndicator
                          count={order.unreadMessageCount ?? 0}
                        />
                      )}
                      {onDelete && (
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
                      )}
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="space-y-1.5 border-b border-gray-100 pb-2 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {order.user?.name || 'Без имени'}
                    </div>
                    {order.user?.email && (
                      <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                        {order.user.email}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {order.phone || '—'}
                    </div>
                    <div className="pt-1">
                      <EditableLabelSelector
                        value={order.user?.label || null}
                        onLabelChange={async newLabel =>
                          onPatch(order.id, { label: newLabel })
                        }
                      />
                    </div>
                  </div>

                  {/* Financial info */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 dark:from-gray-800/50 dark:to-gray-800/30">
                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Сумма
                      </div>
                      <div className="text-base font-bold text-gray-900 dark:text-white">
                        {formatPrice(order.total)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Прибыль
                      </div>
                      <div className="text-base font-bold text-green-600 dark:text-green-400">
                        {formatProfit(profit)}
                      </div>
                    </div>
                  </div>

                  {/* Transport Company */}
                  {(order.transportOptions &&
                    order.transportOptions.length > 0) ||
                  order.transportName ? (
                    <div className="border-t border-gray-100 pt-2 dark:border-gray-700">
                      <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Транспортная компания
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.transportOptions &&
                        order.transportOptions.length > 0
                          ? order.transportOptions
                              .map(opt => opt.transportName)
                              .join(', ')
                          : order.transportName || '—'}
                      </div>
                    </div>
                  ) : null}

                  {/* Gruzchik and Payment */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Грузчик
                      </div>
                      <EditableGruzchikSelector
                        value={order.gruzchikId}
                        gruzchiks={gruzchiks || []}
                        onGruzchikChange={async newGruzchikId =>
                          onPatch(order.id, { gruzchikId: newGruzchikId })
                        }
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Оплата
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.payment ? String(order.payment) : 'Не назначен'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full min-w-max border-collapse">
          {/* Header */}
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
            <tr>
              {showSelection && (
                <th className="w-10 border-b border-gray-200 px-4 py-4 text-left dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) {
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    disabled={selectionDisabled || orders.length === 0}
                    onChange={e => onSelectAll?.(e.target.checked)}
                    aria-label="Выбрать все заказы"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>
              )}
              <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Дата
              </th>
              <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                №
              </th>
              <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Пользователь
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
                Грузчик
              </th>
              <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Транспорт
              </th>
              <th className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Прибыль
              </th>
              {onDelete && (
                <th className="sticky right-0 z-40 whitespace-nowrap border-b border-l border-gray-200 bg-gray-50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  Действия
                </th>
              )}
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
                onPatch={onPatch}
                onDelete={onDelete}
                deletingOrderId={deletingOrderId}
                selected={showSelection ? selectedIds.has(order.id) : false}
                onToggleSelect={onToggleSelect}
                selectionDisabled={selectionDisabled}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
