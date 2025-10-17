'use client';

import { useState, useMemo } from 'react';
import { Package } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderItemCard, OrderItemData } from './OrderItemCard';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { useItemAvailability } from '@/hooks/useItemAvailability';
import { cn } from '@/lib/utils';

export function MobileGruzchikAvailability() {
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
  } = useGruzchikOrders('Наличие');

  // Filter items for availability (you might want to adjust this logic)
  const availabilityItems = useMemo(() => {
    return itemRows.filter(item => item.orderStatus === 'Наличие');
  }, [itemRows]);

  // Group items by provider or order
  const groupedItems = useMemo(() => {
    if (viewMode === 'provider') {
      const grouped = new Map<string, OrderItemData[]>();

      availabilityItems.forEach(item => {
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

      availabilityItems.forEach(item => {
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
  }, [availabilityItems, viewMode, searchQuery]);

  const handleChatOpen = (itemId: string) => {
    console.log('Opening chat for item:', itemId);
  };

  const handleSourceOpen = (itemId: string) => {
    console.log('Opening source for item:', itemId);
  };

  const { updateAvailability, isUpdating } = useItemAvailability({
    onSuccess: (itemId, isAvailable) => {
      console.log('Availability updated successfully:', itemId, isAvailable);
      // Optionally reload data or update local state
    },
    onError: error => {
      console.error('Failed to update availability:', error);
      // Optionally show error message to user
    },
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-red-400" />
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
      {/* Header removed: duplicated with layout header */}

      {/* Content */}
      {groupedItems.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Нет товаров для проверки
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Все товары проверены или нет новых заказов'}
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
                    key={item.itemId}
                    item={item}
                    onChatOpen={handleChatOpen}
                    onSourceOpen={handleSourceOpen}
                    onAvailabilityChange={updateAvailability}
                    isUpdatingAvailability={isUpdating(item.itemId)}
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
