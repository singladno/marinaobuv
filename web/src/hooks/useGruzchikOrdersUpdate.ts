import { useState, useCallback } from 'react';

import type { GruzchikOrder } from '@/types/gruzchik';

export function useGruzchikOrdersUpdate(
  orders: GruzchikOrder[],
  setOrders: (orders: GruzchikOrder[]) => void
) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

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

  return {
    updatingOrders,
    updateOrderOptimistically,
  };
}
