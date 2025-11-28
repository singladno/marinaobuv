'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderItemCard, OrderItemData } from './OrderItemCard';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { useProviderSorting } from '@/contexts/ProviderSortingContext';
import { cn } from '@/lib/utils';

export function MobileGruzchikPurchase() {
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
    updateItemPurchaseOptimistically,
    isUpdatingPurchase,
    isUpdatingPurchaseToValue,
    isUnsettingPurchase,
    isUnsettingPurchaseFromTrue,
    isUnsettingPurchaseFromFalse,
  } = useGruzchikOrders('Купить');

  // Filter items for purchase - only show items from orders with 'Купить' status
  const purchaseItems = useMemo(() => {
    let filtered = itemRows.filter(item => item.orderStatus === 'Купить');

    // Apply purchase status filter (only unpurchased items)
    if (filters.availabilityStatus === 'unset') {
      filtered = filtered.filter(item => {
        // Only show items that are not purchased (false or null)
        return item.isPurchased !== true;
      });
    }

    // Apply provider filter (multi-select in purchase mode)
    if (filters.providerIds && filters.providerIds.length > 0) {
      filtered = filtered.filter(item => {
        return item.providerId && filters.providerIds.includes(item.providerId);
      });
    }

    // Apply client filter
    if (filters.clientId) {
      filtered = filtered.filter(item => {
        return item.customerPhone === filters.clientId;
      });
    }

    return filtered;
  }, [
    itemRows,
    filters.availabilityStatus,
    filters.providerIds,
    filters.clientId,
  ]);

  // Group items by provider or order
  const groupedItems = useMemo(() => {
    if (viewMode === 'provider') {
      const grouped = new Map<
        string,
        { providerId: string | null; items: OrderItemData[] }
      >();

      purchaseItems.forEach(item => {
        const provider = item.provider || 'Неизвестный поставщик';
        const providerId = item.providerId || null;
        if (!grouped.has(provider)) {
          grouped.set(provider, { providerId, items: [] });
        }
        grouped.get(provider)!.items.push(item);
      });

      // Extract unique providers for sorting
      const uniqueProviders = Array.from(grouped.entries())
        .map(([name, data]) => ({
          id: data.providerId || '',
          name: name,
        }))
        .filter(p => p.id); // Filter out providers without IDs

      // Get sorted providers
      const sortedProviders = getSortedProviders(uniqueProviders);

      // Create a map for quick lookup of sort order
      const sortOrderMap = new Map<string, number>();
      sortedProviders.forEach((provider, index) => {
        sortOrderMap.set(provider.id, index);
      });

      // Convert grouped map to array and sort by provider order
      const groupedArray = Array.from(grouped.entries()).map(
        ([provider, data]) => ({
          key: provider,
          title: provider,
          providerId: data.providerId,
          items: data.items.filter(item => {
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
        })
      );

      // Sort by provider order (custom sorted providers first, then unsorted ones)
      groupedArray.sort((a, b) => {
        const aOrder = a.providerId ? sortOrderMap.get(a.providerId) : Infinity;
        const bOrder = b.providerId ? sortOrderMap.get(b.providerId) : Infinity;

        // If both have sort order, use it
        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder;
        }
        // If only one has sort order, it comes first
        if (aOrder !== undefined) return -1;
        if (bOrder !== undefined) return 1;
        // If neither has sort order, maintain original order (by name)
        return a.title.localeCompare(b.title);
      });

      return groupedArray;
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
  }, [
    purchaseItems,
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

  const handlePurchaseChange = async (
    itemId: string,
    isPurchased: boolean | null,
    clickedButton?: boolean
  ) => {
    try {
      await updateItemPurchaseOptimistically(
        itemId,
        isPurchased,
        clickedButton
      );
    } catch (error) {
      console.error('Failed to update purchase status:', error);
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
                    key={`${item.itemId}-${item.isPurchased}`}
                    item={item}
                    onChatOpen={handleChatOpen}
                    onSourceOpen={handleSourceOpen}
                    onPurchaseChange={handlePurchaseChange}
                    isUpdatingPurchase={isUpdatingPurchase(item.itemId)}
                    isUpdatingPurchaseToTrue={isUpdatingPurchaseToValue(
                      item.itemId,
                      true
                    )}
                    isUpdatingPurchaseToFalse={isUpdatingPurchaseToValue(
                      item.itemId,
                      false
                    )}
                    isUnsettingPurchase={isUnsettingPurchase(item.itemId)}
                    isUnsettingPurchaseFromTrue={isUnsettingPurchaseFromTrue(
                      item.itemId
                    )}
                    isUnsettingPurchaseFromFalse={isUnsettingPurchaseFromFalse(
                      item.itemId
                    )}
                    usePurchaseControl={true}
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
