import { useState, useEffect } from 'react';

interface OrderData {
  itemsWithMessages: string[];
  totalItems: number;
  itemsWithMessagesCount: number;
  itemsWithoutMessagesCount: number;
  messageCounts: Record<
    string,
    { totalMessages: number; hasMessages: boolean }
  >;
  unreadCounts: Record<string, { unreadCount: number; totalMessages: number }>;
  approvalStatuses: Record<
    string,
    { isApproved: boolean; approvedAt: string | null }
  >;
}

export function useOrderData(orderId: string | null) {
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderData = async () => {
    if (!orderId) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/order-data`);

      if (!response.ok) {
        throw new Error('Failed to fetch order data');
      }

      const result: OrderData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  // Helper functions for backward compatibility
  const hasMessages = (itemId: string) => {
    return data?.itemsWithMessages.includes(itemId) ?? false;
  };

  const needsApproval = (itemId: string, isAvailable?: boolean | null) => {
    // Items need approval ONLY if they have messages
    return hasMessages(itemId);
  };

  const getTotalMessages = (itemId: string) => {
    return data?.messageCounts[itemId]?.totalMessages ?? 0;
  };

  const getUnreadCount = (itemId: string) => {
    return data?.unreadCounts[itemId] ?? { unreadCount: 0, totalMessages: 0 };
  };

  const getApprovalStatus = (itemId: string) => {
    return (
      data?.approvalStatuses[itemId] ?? { isApproved: false, approvedAt: null }
    );
  };

  const markItemAsApproved = (itemId: string) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        approvalStatuses: {
          ...prev.approvalStatuses,
          [itemId]: {
            isApproved: true,
            approvedAt: new Date().toISOString(),
          },
        },
      };
    });
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
    getTotalMessages,
    getUnreadCount,
    getApprovalStatus,
    markItemAsApproved,
    allItemsApproved,
    refetch: fetchOrderData,
  };
}
