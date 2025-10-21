import { useState, useCallback } from 'react';

import type { GruzchikOrder } from '@/types/gruzchik';

export function useGruzchikOrdersUpdate(
  orders: GruzchikOrder[],
  setOrders: (orders: GruzchikOrder[]) => void
) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<
    Map<string, boolean | null | 'unsetting-true' | 'unsetting-false'>
  >(new Map());

  const updateOrderOptimistically = useCallback(
    async (
      orderId: string,
      updates: {
        label?: string | null;
        payment?: number | null;
        status?: string;
      }
    ) => {
      // Store original state for rollback
      const originalOrders = [...orders];

      // Mark order as updating
      setUpdatingOrders(prev => new Set(prev).add(orderId));

      // Apply optimistic update immediately
      setOrders(
        orders.map(order =>
          order.id === orderId
            ? {
                ...order,
                ...updates,
                payment: updates.payment ?? order.payment,
              }
            : order
        )
      );

      try {
        const response = await fetch('/api/gruzchik/orders/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: orderId,
            ...updates,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update order');
        }

        const { order: updatedOrder } = await response.json();

        // No need to update with server response since we already have optimistic update
        // The optimistic update already shows the correct state
        return { success: true, order: updatedOrder };
      } catch (error) {
        // Rollback on error
        setOrders(originalOrders);
        console.error('Failed to update order:', error);
        throw error;
      } finally {
        // Remove from updating set
        setUpdatingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    },
    [orders, setOrders]
  );

  const updateItemAvailabilityOptimistically = useCallback(
    async (
      itemId: string,
      isAvailable: boolean | null,
      clickedButton?: boolean
    ) => {
      // Mark item as updating with the specific value
      // For null values, we'll use a special marker to track which button was clicked for unsetting
      let updateValue: boolean | null | 'unsetting-true' | 'unsetting-false';
      if (isAvailable === null) {
        // Use the clickedButton parameter to determine which button was clicked for unsetting
        console.log(
          '🔄 Unsetting item',
          itemId,
          'clickedButton:',
          clickedButton
        );
        updateValue =
          clickedButton === true ? 'unsetting-true' : 'unsetting-false';
        console.log('📝 Setting updateValue to:', updateValue);
      } else {
        updateValue = isAvailable;
      }
      setUpdatingItems(prev => new Map(prev).set(itemId, updateValue));

      // Store original state for rollback
      const originalOrders = [...orders];

      // Apply optimistic update immediately
      setOrders(
        orders.map(order => ({
          ...order,
          items: order.items.map(item =>
            item.id === itemId ? { ...item, isAvailable } : item
          ),
        }))
      );

      try {
        const response = await fetch(
          `/api/gruzchik/order-items/${itemId}/availability`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isAvailable }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update availability');
        }

        const result = await response.json();

        if (result.success) {
          return { success: true };
        } else {
          throw new Error(result.error || 'Failed to update availability');
        }
      } catch (error) {
        // Rollback on error
        setOrders(originalOrders);
        console.error('Failed to update item availability:', error);
        throw error;
      } finally {
        // Remove from updating map
        setUpdatingItems(prev => {
          const newMap = new Map(prev);
          newMap.delete(itemId);
          return newMap;
        });
      }
    },
    [orders, setOrders]
  );

  return {
    updatingOrders,
    updateOrderOptimistically,
    updateItemAvailabilityOptimistically,
    updatingItems,
    isUpdatingItem: (itemId: string) => updatingItems.has(itemId),
    isUpdatingItemToValue: (itemId: string, value: boolean | null) =>
      updatingItems.get(itemId) === value,
    isUnsettingItem: (itemId: string) => {
      const value = updatingItems.get(itemId);
      return value === 'unsetting-true' || value === 'unsetting-false';
    },
    isUnsettingItemFromTrue: (itemId: string) =>
      updatingItems.get(itemId) === 'unsetting-true',
    isUnsettingItemFromFalse: (itemId: string) =>
      updatingItems.get(itemId) === 'unsetting-false',
  };
}
