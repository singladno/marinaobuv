import { useEffect, useState } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useUser } from '@/contexts/UserContext';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
  replacements?: Array<{
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    replacementImageUrl: string | null;
    adminComment: string | null;
    createdAt: string;
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export function useOrdersData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    const fetchOrders = async () => {
      // Don't make API call if user is not authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        addNotification({
          type: 'error',
          title: 'Ошибка загрузки заказов',
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch orders when user loading is complete
    if (!userLoading) {
      fetchOrders();
    }
  }, [addNotification, user, userLoading]);

  return {
    orders,
    loading: loading || userLoading,
    error,
    isAuthenticated: !!user,
  };
}
