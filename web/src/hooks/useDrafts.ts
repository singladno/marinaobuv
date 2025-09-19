import { useEffect, useState } from 'react';
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

  const load = async (
    page = pagination.page,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * pageSize;
      const res = await fetch(
        `/api/admin/drafts?status=${status ?? ''}&skip=${skip}&take=${pageSize}`,
        {
          headers: { 'x-role': 'ADMIN' },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.drafts ?? []);
      setPagination({
        page: json.page ?? page,
        pageSize: json.pageSize ?? pageSize,
        total: json.total ?? 0,
        totalPages: json.totalPages ?? 0,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const loadSilent = async () => {
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
      setPagination({
        page: json.page ?? pagination.page,
        pageSize: json.pageSize ?? pagination.pageSize,
        total: json.total ?? pagination.total,
        totalPages: json.totalPages ?? pagination.totalPages,
      });
    } catch (e) {
      // swallow errors silently for background refresh
      console.error('Silent reload drafts failed', e);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      load(page, pagination.pageSize);
    }
  };

  const changePageSize = (newPageSize: number) => {
    load(1, newPageSize);
  };

  useEffect(() => {
    load();
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
