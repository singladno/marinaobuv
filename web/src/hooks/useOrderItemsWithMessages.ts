import { useState, useEffect } from 'react';

interface OrderItemsWithMessagesData {
  itemsWithMessages: string[];
  totalItems: number;
  itemsWithMessagesCount: number;
  itemsWithoutMessagesCount: number;
}

export function useOrderItemsWithMessages(orderId: string | null) {
  const [data, setData] = useState<OrderItemsWithMessagesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      return;
    }

    const fetchItemsWithMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/orders/${orderId}/items-with-messages`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch items with messages');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchItemsWithMessages();
  }, [orderId]);

  const hasMessages = (itemId: string) => {
    return data?.itemsWithMessages.includes(itemId) ?? false;
  };

  const needsApproval = (itemId: string, isAvailable?: boolean | null) => {
    // Items need approval ONLY if they have messages
    return hasMessages(itemId);
  };

  const allItemsApproved = () => {
    if (!data) return false;
    return data.itemsWithMessagesCount === 0; // All items without messages are auto-approved
  };

  return {
    data,
    loading,
    error,
    hasMessages,
    needsApproval,
    allItemsApproved,
  };
}
