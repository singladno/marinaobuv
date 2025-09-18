import { useEffect, useState } from 'react';
import type { Draft } from '@/types/admin';

export function useDrafts() {
  const [data, setData] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>('draft');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drafts?status=${status ?? ''}`, {
        headers: { 'x-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.drafts ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const loadSilent = async () => {
    try {
      const res = await fetch(`/api/admin/drafts?status=${status ?? ''}`, {
        headers: { 'x-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.drafts ?? []);
    } catch (e) {
      // swallow errors silently for background refresh
      console.error('Silent reload drafts failed', e);
    }
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
  };
}
