'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderItemCard, OrderItemData } from './OrderItemCard';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { cn } from '@/lib/utils';

export function MobileGruzchikPurchase() {
  const { viewMode, searchQuery } = useGruzchikView();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const {
    orders,
    itemRows,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    reload,
    updateItemAvailabilityOptimistically,
    isUpdatingItem,
    isUpdatingItemToValue,
    isUnsettingItem,
    isUnsettingItemFromTrue,
    isUnsettingItemFromFalse,
  } = useGruzchikOrders('Купить');

  // Filter items for purchase - only show items from orders with 'Купить' status
  const purchaseItems = useMemo(() => {
    return itemRows.filter(item => item.orderStatus === 'Купить');
  }, [itemRows]);

  // Group items by provider or order
  const groupedItems = useMemo(() => {
    if (viewMode === 'provider') {
      const grouped = new Map<string, OrderItemData[]>();

      purchaseItems.forEach(item => {
        const provider = item.provider || 'Неизвестный поставщик';
        if (!grouped.has(provider)) {
          grouped.set(provider, []);
        }
        grouped.get(provider)!.push(item);
      });

      return Array.from(grouped.entries()).map(([provider, items]) => ({
        key: provider,
        title: provider,
        items: items.filter(item => {
          if (!searchQuery) return true;
          const customerInfo = item.orderLabel
            ? `${item.orderLabel} ${item.customerPhone}`
            : item.customerPhone;
          return (
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerInfo.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }),
      }));
    } else {
      const grouped = new Map<string, OrderItemData[]>();

      purchaseItems.forEach(item => {
        const customerInfo = item.orderLabel
          ? `${item.orderLabel} - ${item.customerPhone}`
          : item.customerPhone;
        const orderKey = `${item.orderNumber} - ${customerInfo}`;
        if (!grouped.has(orderKey)) {
          grouped.set(orderKey, []);
        }
        grouped.get(orderKey)!.push(item);
      });

      return Array.from(grouped.entries()).map(([orderKey, items]) => ({
        key: orderKey,
        title: orderKey,
        items: items.filter(item => {
          if (!searchQuery) return true;
          const customerInfo = item.orderLabel
            ? `${item.orderLabel} ${item.customerPhone}`
            : item.customerPhone;
          return (
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerInfo.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }),
      }));
    }
  }, [purchaseItems, viewMode, searchQuery]);

  const handleChatOpen = (itemId: string) => {
    console.log('Opening chat for item:', itemId);
  };

  const handleSourceOpen = (itemId: string) => {
    console.log('Opening source for item:', itemId);
  };

  const handleAvailabilityChange = async (
    itemId: string,
    isAvailable: boolean | null,
    clickedButton?: boolean
  ) => {
    try {
      await updateItemAvailabilityOptimistically(
        itemId,
        isAvailable,
        clickedButton
      );
    } catch (error) {
      console.error('Failed to update availability:', error);
      // Optionally show error message to user
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-red-400" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Закупка</h1>
          <p className="text-sm text-gray-500">Закупка товаров у поставщиков</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {purchaseItems.length} товаров
        </Badge>
      </div>

      {/* Content */}
      {groupedItems.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Нет товаров для закупки
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Все товары закуплены или нет новых заказов'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(group => (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{group.title}</h2>
                <Badge variant="outline" className="text-xs">
                  {group.items.length} товаров
                </Badge>
              </div>

              <div className="space-y-3">
                {group.items.map(item => (
                  <OrderItemCard
                    key={`${item.itemId}-${item.isAvailable}`}
                    item={item}
                    onChatOpen={handleChatOpen}
                    onSourceOpen={handleSourceOpen}
                    onAvailabilityChange={handleAvailabilityChange}
                    isUpdatingAvailability={isUpdatingItem(item.itemId)}
                    isUpdatingToTrue={isUpdatingItemToValue(item.itemId, true)}
                    isUpdatingToFalse={isUpdatingItemToValue(
                      item.itemId,
                      false
                    )}
                    isUnsetting={isUnsettingItem(item.itemId)}
                    isUnsettingFromTrue={isUnsettingItemFromTrue(item.itemId)}
                    isUnsettingFromFalse={isUnsettingItemFromFalse(item.itemId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
