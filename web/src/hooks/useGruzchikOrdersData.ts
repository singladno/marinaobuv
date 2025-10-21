import { useState, useEffect, useCallback } from 'react';

import type { GruzchikOrder } from '@/types/gruzchik';

export function useGruzchikOrdersData(status?: string) {
  const [orders, setOrders] = useState<GruzchikOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = useCallback(
    async (page = 1, limit = 10) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) {
          params.append('status', status);
        }

        const response = await fetch(`/api/gruzchik/orders?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    fetchOrders();
  }, [status, fetchOrders]);

  const onPageChange = (page: number) => {
    fetchOrders(page, pagination.pageSize);
  };

  const onPageSizeChange = (pageSize: number) => {
    fetchOrders(1, pageSize);
  };

  const reload = () => {
    fetchOrders(pagination.page, pagination.pageSize);
  };

  return {
    orders,
    setOrders,
    loading,
    error,
    pagination,
    onPageChange,
    onPageSizeChange,
    reload,
  };
}
