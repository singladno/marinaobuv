'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { cn } from '@/lib/utils';

interface OrderVerificationData {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string;
  items: {
    itemId: string;
    itemName: string;
    itemImage: string | null;
    isAvailable: boolean | null;
  }[];
  canVerify: boolean;
  missingAvailability: string[];
}

export function MobileGruzchikVerification() {
  const { searchQuery } = useGruzchikView();
  const { filters } = useGruzchikFilter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { orders, loading, error, reload } = useGruzchikOrders('Наличие');

  // Filter and prepare orders for verification
  const verificationOrders = useMemo(() => {
    let filtered = orders.filter(order => order.status === 'Наличие');

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.phone.toLowerCase().includes(searchLower) ||
          order.fullName?.toLowerCase().includes(searchLower) ||
          order.items.some(item =>
            item.name.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    // Apply client filter
    if (filters.clientId) {
      filtered = filtered.filter(order => order.phone === filters.clientId);
    }

    // Transform orders for verification
    return filtered.map(order => {
      const missingAvailability: string[] = [];
      let canVerify = true;

      order.items.forEach(item => {
        if (item.isAvailable === null || item.isAvailable === undefined) {
          missingAvailability.push(item.name);
          canVerify = false;
        }
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.fullName,
        customerPhone: order.phone,
        items: order.items.map(item => ({
          itemId: item.id,
          itemName: item.name,
          itemImage:
            item.product.images.find(img => img.isPrimary)?.url ||
            item.product.images[0]?.url ||
            null,
          isAvailable: item.isAvailable,
        })),
        canVerify,
        missingAvailability,
      } as OrderVerificationData;
    });
  }, [orders, searchQuery, filters.clientId]);

  const selectedOrder = verificationOrders.find(
    order => order.orderId === selectedOrderId
  );

  // Don't select any order by default - list should be hidden

  const handleVerifyOrder = async () => {
    if (!selectedOrder || !selectedOrder.canVerify) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/gruzchik/orders/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify order');
      }

      // Reload orders to get updated data
      await reload();

      // Clear selection
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Failed to verify order:', error);
      // TODO: Show error message to user
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="mb-2 text-red-500">Ошибка загрузки</p>
          <Button onClick={reload} variant="outline" size="sm">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {verificationOrders.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Нет заказов для проверки
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Все заказы проверены или нет новых заказов'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Orders List */}
          {verificationOrders.map(order => (
            <div
              key={order.orderId}
              className={cn(
                'rounded-lg border-2 p-4 transition-all duration-200',
                selectedOrderId === order.orderId
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      Заказ {order.orderNumber}
                    </h3>
                    <Badge
                      variant={order.canVerify ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {order.canVerify ? 'Готов к проверке' : 'Не готов'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.customerName || 'Без имени'} • {order.customerPhone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.items.length} товар
                    {order.items.length === 1 ? '' : 'ов'}
                  </p>
                </div>

                <Button
                  key={`chevron-${order.orderId}-${selectedOrderId}`}
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    console.log(
                      'Chevron button clicked for order:',
                      order.orderId
                    );
                    console.log('Current selectedOrderId:', selectedOrderId);
                    const newSelectedId =
                      selectedOrderId === order.orderId ? null : order.orderId;
                    console.log('Setting selectedOrderId to:', newSelectedId);
                    setSelectedOrderId(newSelectedId);
                  }}
                  className="ml-2 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <div className="transition-transform duration-200 ease-in-out">
                    {selectedOrderId === order.orderId ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </div>

              {/* Missing availability warning */}
              {!order.canVerify && order.missingAvailability.length > 0 && (
                <div className="mt-3 rounded-md bg-red-50 p-3">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">
                        Не указана доступность для товаров:
                      </p>
                      <p className="text-red-700">
                        {order.missingAvailability.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Selected Order Details */}
          {selectedOrder && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Детали заказа {selectedOrder.orderNumber}
                </h3>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                  >
                    {/* Item Image */}
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.itemImage ? (
                        <Image
                          src={item.itemImage}
                          alt={item.itemName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {item.itemName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.isAvailable === true
                              ? 'default'
                              : item.isAvailable === false
                                ? 'destructive'
                                : 'secondary'
                          }
                          className={cn(
                            'text-xs font-medium',
                            item.isAvailable === true
                              ? 'border-green-200 bg-green-100 text-green-800'
                              : item.isAvailable === false
                                ? 'border-red-200 bg-red-100 text-red-800'
                                : 'border-gray-200 bg-gray-100 text-gray-800'
                          )}
                        >
                          {item.isAvailable === true
                            ? 'В наличии'
                            : item.isAvailable === false
                              ? 'Нет в наличии'
                              : 'Не указано'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verify Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleVerifyOrder}
                  disabled={!selectedOrder.canVerify || isVerifying}
                  className="min-w-[120px]"
                >
                  {isVerifying ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Подтвердить
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
