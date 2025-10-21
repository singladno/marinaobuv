import { useState, useEffect } from 'react';

interface ApprovalStatus {
  isApproved: boolean;
  approvedAt: string | null;
}

interface OrderItemApprovalStatuses {
  [itemId: string]: ApprovalStatus;
}

export function useOrderItemApprovalStatuses(orderId: string | null) {
  const [approvalStatuses, setApprovalStatuses] =
    useState<OrderItemApprovalStatuses>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovalStatuses = async () => {
    if (!orderId) {
      setApprovalStatuses({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/approval-statuses`);

      if (!response.ok) {
        throw new Error('Failed to fetch approval statuses');
      }

      const data: { approvalStatuses: OrderItemApprovalStatuses } =
        await response.json();
      setApprovalStatuses(data.approvalStatuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApprovalStatuses({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatuses();
  }, [orderId]);

  const getApprovalStatus = (itemId: string): ApprovalStatus => {
    return approvalStatuses[itemId] || { isApproved: false, approvedAt: null };
  };

  const markItemAsApproved = (itemId: string) => {
    setApprovalStatuses(prev => ({
      ...prev,
      [itemId]: {
        isApproved: true,
        approvedAt: new Date().toISOString(),
      },
    }));
  };

  return {
    approvalStatuses,
    loading,
    error,
    getApprovalStatus,
    markItemAsApproved,
    refetch: fetchApprovalStatuses,
  };
}
