'use client';

import { useState, useEffect, useCallback } from 'react';

export type GruzchikOrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    name: string;
    slug: string;
    article: string | null;
    image: string | null;
  };
};

export type GruzchikOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  fullName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  transportId: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  status: string;
  label: string | null;
  payment: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
  items: GruzchikOrderItem[];
};

export function useGruzchikOrders(status?: string) {
  const [orders, setOrders] = useState<GruzchikOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/gruzchik/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const onPageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
  };

  const onPageSizeChange = (limit: number) => {
    fetchOrders(1, limit);
  };

  const reload = () => {
    fetchOrders(pagination.page, pagination.limit);
  };

  // Optimistic update function
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
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
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
    [orders]
  );

  return {
    orders,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    reload,
    updateOrderOptimistically,
    updatingOrders,
  };
}
