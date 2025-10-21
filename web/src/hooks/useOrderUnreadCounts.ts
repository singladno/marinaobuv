import { useEffect, useState } from 'react';

interface UnreadCountData {
  unreadCount: number;
  totalMessages: number;
}

interface OrderUnreadCounts {
  [itemId: string]: UnreadCountData;
}

export function useOrderUnreadCounts(orderId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<OrderUnreadCounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCounts = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/unread-counts`);

      if (!response.ok) {
        throw new Error('Failed to fetch unread counts');
      }

      const data: { unreadCounts: OrderUnreadCounts } = await response.json();
      setUnreadCounts(data.unreadCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUnreadCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [orderId]);

  const getUnreadCount = (itemId: string): UnreadCountData => {
    return unreadCounts[itemId] || { unreadCount: 0, totalMessages: 0 };
  };

  return {
    unreadCounts,
    loading,
    error,
    getUnreadCount,
    refetch: fetchUnreadCounts,
  };
}
