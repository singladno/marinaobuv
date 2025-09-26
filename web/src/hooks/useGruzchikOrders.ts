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
  itemCode: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    article: string | null;
    image: string | null;
  };
  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
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

// Flattened structure where each row represents an order item
export type GruzchikOrderItemRow = {
  // Order info
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  orderLabel: string | null;
  orderPayment: number;
  orderTotal: number;
  
  // Customer info
  customerName: string | null;
  customerPhone: string;
  
  // Item info
  itemId: string;
  itemName: string;
  itemArticle: string | null;
  itemQty: number;
  itemPrice: number;
  itemCode: string | null;
  itemImage: string | null;
  
  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
};

// Helper function to flatten orders into item rows
function flattenOrdersToItems(orders: GruzchikOrder[]): GruzchikOrderItemRow[] {
  const itemRows: GruzchikOrderItemRow[] = [];
  
  orders.forEach(order => {
    order.items.forEach(item => {
      itemRows.push({
        // Order info
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        orderStatus: order.status,
        orderLabel: order.label,
        orderPayment: order.payment,
        orderTotal: order.total,
        
        // Customer info
        customerName: order.fullName,
        customerPhone: order.phone,
        
        // Item info
        itemId: item.id,
        itemName: item.name,
        itemArticle: item.article,
        itemQty: item.qty,
        itemPrice: item.priceBox,
        itemCode: item.itemCode,
        itemImage: item.product.image,
        
        // WhatsApp message info
        messageId: item.messageId,
        messageText: item.messageText,
        messageDate: item.messageDate,
      });
    });
  });
  
  return itemRows;
}

export function useGruzchikOrders(status?: string) {
  const [orders, setOrders] = useState<GruzchikOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = useCallback(
    async (page = 1, limit = 10) => {
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
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const onPageChange = (page: number) => {
    fetchOrders(page, pagination.pageSize);
  };

  const onPageSizeChange = (pageSize: number) => {
    fetchOrders(1, pageSize);
  };

  const reload = () => {
    fetchOrders(pagination.page, pagination.pageSize);
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

  // Flatten orders into item rows
  const itemRows = flattenOrdersToItems(orders);

  return {
    orders,
    itemRows,
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
