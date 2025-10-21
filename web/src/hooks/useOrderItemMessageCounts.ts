import { useState, useEffect } from 'react';

interface ItemMessageCount {
  totalMessages: number;
  hasMessages: boolean;
}

interface OrderItemMessageCountsData {
  messageCounts: Record<string, ItemMessageCount>;
}

export function useOrderItemMessageCounts(orderId: string | null) {
  const [data, setData] = useState<OrderItemMessageCountsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      return;
    }

    const fetchMessageCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/orders/${orderId}/item-message-counts`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch message counts');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCounts();
  }, [orderId]);

  const getMessageCount = (itemId: string) => {
    return (
      data?.messageCounts[itemId] || { totalMessages: 0, hasMessages: false }
    );
  };

  const hasMessages = (itemId: string) => {
    return getMessageCount(itemId).hasMessages;
  };

  const getTotalMessages = (itemId: string) => {
    return getMessageCount(itemId).totalMessages;
  };

  return {
    data,
    loading,
    error,
    getMessageCount,
    hasMessages,
    getTotalMessages,
  };
}
