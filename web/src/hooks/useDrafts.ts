import { useEffect, useState, useCallback } from 'react';

import type { Draft } from '@/types/admin';

export function useDrafts() {
  const [data, setData] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>('draft');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const load = useCallback(
    async (page?: number, pageSize?: number) => {
      setLoading(true);
      setError(null);
      try {
        const currentPage = page ?? pagination.page;
        const currentPageSize = pageSize ?? pagination.pageSize;
        const skip = (currentPage - 1) * currentPageSize;
        const res = await fetch(
          `/api/admin/drafts?status=${status ?? ''}&skip=${skip}&take=${currentPageSize}`,
          {
            headers: { 'x-role': 'ADMIN' },
          }
        );
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json.drafts ?? []);
        setPagination({
          page: json.page ?? currentPage,
          pageSize: json.pageSize ?? currentPageSize,
          total: json.total ?? 0,
          totalPages: json.totalPages ?? 0,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load drafts');
      } finally {
        setLoading(false);
      }
    },
    [status, pagination.page, pagination.pageSize]
  );

  const loadSilent = useCallback(async () => {
    try {
      const skip = (pagination.page - 1) * pagination.pageSize;
      const res = await fetch(
        `/api/admin/drafts?status=${status ?? ''}&skip=${skip}&take=${pagination.pageSize}`,
        {
          headers: { 'x-role': 'ADMIN' },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.drafts ?? []);
      setPagination(prev => ({
        page: json.page ?? prev.page,
        pageSize: json.pageSize ?? prev.pageSize,
        total: json.total ?? prev.total,
        totalPages: json.totalPages ?? prev.totalPages,
      }));
    } catch (e) {
      // swallow errors silently for background refresh
      console.error('Silent reload drafts failed', e);
    }
  }, [status, pagination.page, pagination.pageSize]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      load(page, pagination.pageSize);
    }
  };

  const changePageSize = (newPageSize: number) => {
    load(1, newPageSize);
  };

  // Load data when status changes, but reset to page 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    load(1, 10); // Use default page size to avoid dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return {
    data,
    loading,
    error,
    reload: load,
    reloadSilent: loadSilent,
    status,
    setStatus,
    pagination,
    goToPage,
    changePageSize,
  };
}
