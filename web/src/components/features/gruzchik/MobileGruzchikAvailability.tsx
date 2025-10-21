'use client';

import { useState, useMemo, useEffect } from 'react';
import { Package } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderItemCard, OrderItemData } from './OrderItemCard';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { useProviderSorting } from '@/contexts/ProviderSortingContext';
import { cn } from '@/lib/utils';

export function MobileGruzchikAvailability() {
  const { viewMode, searchQuery } = useGruzchikView();
  const { filters } = useGruzchikFilter();

  const { getSortedProviders, sortedProviderIds } = useProviderSorting();

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
  } = useGruzchikOrders('Наличие');

  // Filter items for availability and apply filters
  const availabilityItems = useMemo(() => {
    let filtered = itemRows.filter(item => item.orderStatus === 'Наличие');

    // Apply availability status filter
    if (filters.availabilityStatus !== 'all') {
      filtered = filtered.filter(item => {
        switch (filters.availabilityStatus) {
          case 'unset':
            return item.isAvailable === null || item.isAvailable === undefined;
          case 'available':
            return item.isAvailable === true;
          case 'unavailable':
            return item.isAvailable === false;
          default:
            return true;
        }
      });
    }

    // Apply provider filter
    if (filters.providerId) {
      filtered = filtered.filter(item => {
        // Check if item has provider ID that matches the selected provider
        return item.providerId === filters.providerId;
      });
    }

    // Apply client filter
    if (filters.clientId) {
      filtered = filtered.filter(item => {
        // Filter by customer phone number
        return item.customerPhone === filters.clientId;
      });
    }

    return filtered;
  }, [
    itemRows,
    filters.availabilityStatus,
    filters.providerId,
    filters.clientId,
  ]);

  // Group items by provider or order
  const groupedItems = useMemo(() => {
    if (viewMode === 'provider') {
      const grouped = new Map<string, OrderItemData[]>();

      availabilityItems.forEach(item => {
        const provider = item.provider || 'Неизвестный поставщик';
        const providerId = item.providerId || 'unknown';
        const groupKey = `${providerId}:${provider}`;

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, []);
        }
        grouped.get(groupKey)!.push(item);
      });

      // Get all unique providers with their IDs and sort them
      const providerMap = new Map<string, { id: string; name: string }>();

      availabilityItems.forEach(item => {
        if (item.providerId && item.provider) {
          providerMap.set(item.providerId, {
            id: item.providerId,
            name: item.provider,
          });
        }
      });

      const allProviders = Array.from(providerMap.values());
      const sortedProviders = getSortedProviders(allProviders);

      // Return groups in sorted order
      const result = sortedProviders.map(provider => {
        const groupKey = `${provider.id}:${provider.name}`;
        const items = grouped.get(groupKey) || [];
        return {
          key: groupKey,
          title: provider.name,
          items: items.filter(item => {
            if (!searchQuery) return true;
            const customerInfo = item.orderLabel
              ? `${item.orderLabel} ${item.customerPhone}`
              : item.customerPhone;
            return (
              item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.itemCode
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              customerInfo.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }),
        };
      });

      return result;
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
  }, [
    availabilityItems,
    viewMode,
    searchQuery,
    getSortedProviders,
    sortedProviderIds,
  ]);

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
        <div className="space-y-8">
          {groupedItems.map((group, index) => (
            <div key={group.key} className="relative">
              {/* Enhanced Group Header */}
              <div className="sticky top-0 z-10 mb-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {group.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {viewMode === 'provider' ? 'Поставщик' : 'Заказ'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border-blue-200 bg-blue-100 text-blue-700"
                  >
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'товар' : 'товаров'}
                  </Badge>
                </div>
              </div>

              {/* Items Container */}
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

              {/* Section Divider */}
              {index < groupedItems.length - 1 && (
                <div className="mt-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="mx-4 flex items-center gap-2 text-xs text-gray-500">
                    <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                  </div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
