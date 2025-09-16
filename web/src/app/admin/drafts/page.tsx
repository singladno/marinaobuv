'use client';

import { DraftsTable } from '@/components/features/DraftsTable';
import type { Draft } from '@/types/admin';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { useMemo, useState } from 'react';

export default function AdminDraftsPage() {
  const { data, loading, error, reload, status, setStatus } = useDrafts();
  const { categories, loading: categoriesLoading } = useCategories();
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

  const convertToCatalog = async () => {
    const res = await fetch(`/api/admin/drafts/convert-to-catalog`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!res.ok) alert(await res.text());
    await reload();
    setSelected({});
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 overflow-auto">
        <DraftsTable
          data={data}
          selected={selected}
          onToggle={toggle}
          onPatch={inlinePatch}
          status={status}
          onStatusChange={setStatus}
          onReload={reload}
          onApprove={approve}
          onConvertToCatalog={convertToCatalog}
          selectedCount={selectedIds.length}
          loading={loading || categoriesLoading}
          error={error}
          categories={categories}
        />
      </div>
    </div>
  );
}
