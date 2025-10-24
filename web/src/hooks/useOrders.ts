import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/components/ui/NotificationProvider';

export type AdminOrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  phone: string;
  fullName: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  label: string | null;
  payment: number;
  gruzchikId: string | null;
  gruzchik?: { id: string; name: string | null } | null;
  user?: {
    id: string;
    name: string | null;
    phone: string | null;
    label: string | null;
  } | null;
  items: AdminOrderItem[];
  unreadMessageCount?: number;
};

export type Gruzchik = {
  id: string;
  name: string | null;
  phone: string | null;
};

export function useOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [gruzchiks, setGruzchiks] = useState<Gruzchik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to load orders');
      setOrders(j.orders || []);
      setGruzchiks(j.gruzchiks || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (id: string, data: Partial<AdminOrder>) => {
      // Store original state for rollback
      const originalOrders = [...orders];

      // Find the target order to get the user ID
      const targetOrder = orders.find(order => order.id === id);
      const targetUserId = targetOrder?.user?.id;

      // Only apply optimistic update for non-status changes
      // Status changes should only update after API success
      const isStatusChange = data.status !== undefined;

      if (!isStatusChange) {
        // Apply optimistic update immediately for non-status changes
        setOrders(prevOrders =>
          prevOrders.map(order => {
            if (order.id === id) {
              // Handle label updates specifically for user.label
              if (data.label !== undefined && order.user) {
                return {
                  ...order,
                  ...data,
                  user: {
                    ...order.user,
                    label: data.label,
                  },
                };
              }
              return { ...order, ...data };
            }

            // If this is a label update, also update all other orders from the same user
            if (
              data.label !== undefined &&
              targetUserId &&
              order.user?.id === targetUserId &&
              order.id !== id
            ) {
              return {
                ...order,
                user: {
                  ...order.user,
                  label: data.label,
                },
              };
            }

            return order;
          })
        );
      }

      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });
        const j = await res.json();
        if (!res.ok) {
          // Show error notification
          addNotification({
            type: 'error',
            title: 'Ошибка обновления заказа',
            message: j.error || 'Ошибка обновления заказа',
          });
          // Don't throw - just return to trigger rollback
          return;
        }

        // Apply update after successful API call
        if (isStatusChange) {
          // For status changes, update the UI only after API success
          setOrders(prevOrders =>
            prevOrders.map(order => {
              if (order.id === id) {
                return { ...order, ...data };
              }
              return order;
            })
          );
        }

        return j.order as AdminOrder;
      } catch (error) {
        // Rollback on error (only needed for non-status changes)
        if (!isStatusChange) {
          setOrders(originalOrders);
        }
        throw error;
      }

      // If we reach here, it means we returned early due to API error
      // Rollback the optimistic update (only needed for non-status changes)
      if (!isStatusChange) {
        setOrders(originalOrders);
      }
    },
    [orders, addNotification]
  );

  const deleteOrders = useCallback(
    async (orderIds: string[]) => {
      // Store original state for rollback
      const originalOrders = [...orders];

      // Apply optimistic update immediately - remove deleted orders
      setOrders(prevOrders =>
        prevOrders.filter(order => !orderIds.includes(order.id))
      );

      try {
        const res = await fetch('/api/admin/orders/bulk-delete', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderIds }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Delete failed');

        return j;
      } catch (error) {
        // Rollback on error
        setOrders(originalOrders);
        throw error;
      }
    },
    [orders]
  );

  return {
    orders,
    gruzchiks,
    loading,
    error,
    reload: load,
    update,
    deleteOrders,
  };
}
