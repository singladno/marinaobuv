import { useState, useEffect } from 'react';

interface UnreadCountResponse {
  unreadCount: number;
  totalMessages: number;
}

export function useClientUnreadMessageCount(itemId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/order-items/${itemId}/unread-count`);

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data: UnreadCountResponse = await response.json();
      setUnreadCount(data.unreadCount);
      setTotalMessages(data.totalMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUnreadCount(0);
      setTotalMessages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [itemId]);

  return {
    unreadCount,
    totalMessages,
    loading,
    error,
    refetch: fetchUnreadCount,
  };
}
