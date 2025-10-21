import { useCallback, useEffect, useState } from 'react';

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
  user?: { id: string; name: string | null; phone: string | null } | null;
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

      // Apply optimistic update immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id ? { ...order, ...data } : order
        )
      );

      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Update failed');

        // No need to reload - optimistic update already shows correct state
        return j.order as AdminOrder;
      } catch (error) {
        // Rollback on error
        setOrders(originalOrders);
        throw error;
      }
    },
    [orders]
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
