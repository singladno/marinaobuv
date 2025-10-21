import { useState, useEffect } from 'react';

interface ApprovalStatus {
  isApproved: boolean;
  approvedAt: string | null;
}

export function useItemApprovalStatus(itemId: string | null) {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>({
    isApproved: false,
    approvedAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovalStatus = async () => {
    if (!itemId) {
      setApprovalStatus({ isApproved: false, approvedAt: null });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/order-items/${itemId}/approval-status`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch approval status');
      }

      const data: ApprovalStatus = await response.json();
      setApprovalStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApprovalStatus({ isApproved: false, approvedAt: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatus();
  }, [itemId]);

  const markAsApproved = () => {
    setApprovalStatus(prev => ({
      ...prev,
      isApproved: true,
      approvedAt: new Date().toISOString(),
    }));
  };

  return {
    ...approvalStatus,
    loading,
    error,
    refetch: fetchApprovalStatus,
    markAsApproved,
  };
}
