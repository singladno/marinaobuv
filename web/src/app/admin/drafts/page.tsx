'use client';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DraftsTable } from '@/components/features/DraftsTable';
import type { Draft } from '@/types/admin';
import { useDrafts } from '@/hooks/useDrafts';
import { useMemo, useState } from 'react';

export default function AdminDraftsPage() {
  const { data, loading, error, reload, status, setStatus } = useDrafts();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter(k => selected[k]),
    [selected]
  );

  const toggle = (id: string) => setSelected(m => ({ ...m, [id]: !m[id] }));
  const inlinePatch = async (id: string, patch: Partial<Draft>) => {
    await fetch(`/api/admin/drafts`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      body: JSON.stringify({ id, data: patch }),
    });
    await reload();
  };
  const approve = async () => {
    const categoryId = prompt('Category ID to place products into:');
    if (!categoryId) return;
    const res = await fetch(`/api/admin/drafts/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      body: JSON.stringify({ ids: selectedIds, categoryId }),
    });
    if (!res.ok) alert(await res.text());
    await reload();
    setSelected({});
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-3 pb-4">
        <h1 className="text-xl font-semibold">Черновики товаров</h1>
        <Select
          value={status ?? 'draft'}
          onChange={e => setStatus(e.target.value || undefined)}
        >
          <option value="">Все</option>
          <option value="draft">Черновик</option>
          <option value="approved">Одобрено</option>
          <option value="processed">Обработано</option>
        </Select>
        <Button onClick={reload} variant="secondary">
          Обновить
        </Button>
        <Button onClick={approve} disabled={!selectedIds.length}>
          Одобрить выбранные ({selectedIds.length})
        </Button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <DraftsTable
            data={data}
            selected={selected}
            onToggle={toggle}
            onPatch={inlinePatch}
          />
        </div>
      )}
    </div>
  );
}
