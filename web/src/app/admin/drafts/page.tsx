'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

type Draft = {
  id: string;
  name: string;
  article: string | null;
  pricePair: number | null;
  currency: string;
  packPairs: number | null;
  priceBox: number | null;
  material: string | null;
  gender: string | null;
  season: string | null;
  description: string | null;
  status: string;
  images: { id: string; url: string; isPrimary: boolean; sort: number }[];
};

function useDrafts() {
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return { data, loading, error, reload: load, status, setStatus };
}

function Row({
  d,
  selected,
  onToggle,
}: {
  d: Draft;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const [local, setLocal] = useState({
    name: d.name,
    article: d.article ?? '',
  });
  const patch = async () => {
    await fetch(`/api/admin/drafts`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      body: JSON.stringify({
        id: d.id,
        data: { name: local.name, article: local.article || null },
      }),
    });
  };
  return (
    <tr className="border-b">
      <td>
        <input
          aria-label="Выбрать черновик"
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(d.id)}
        />
      </td>
      <td className="w-[280px] p-2">
        <Input
          aria-label="Название"
          value={local.name}
          onChange={e => setLocal({ ...local, name: e.target.value })}
          onBlur={patch}
        />
      </td>
      <td className="w-[160px] p-2">
        <Input
          aria-label="Артикул"
          value={local.article}
          onChange={e => setLocal({ ...local, article: e.target.value })}
          onBlur={patch}
        />
      </td>
      <td className="p-2">{d.pricePair ?? '—'}</td>
      <td className="p-2">{d.currency}</td>
      <td className="p-2">{d.status}</td>
      <td className="p-2">
        <div className="flex gap-1 overflow-x-auto">
          {d.images?.slice(0, 4).map(img => (
            <img
              key={img.id}
              src={img.url}
              className="h-10 w-10 rounded object-cover"
              alt=""
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function AdminDraftsPage() {
  const { data, loading, error, reload, status, setStatus } = useDrafts();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter(k => selected[k]),
    [selected]
  );

  const toggle = (id: string) => setSelected(m => ({ ...m, [id]: !m[id] }));
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
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-3">
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
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="w-8 p-2"></th>
                <th className="p-2">Название</th>
                <th className="p-2">Артикул</th>
                <th className="p-2">Цена/пара</th>
                <th className="p-2">Валюта</th>
                <th className="p-2">Статус</th>
                <th className="p-2">Изображения</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <Row
                  key={d.id}
                  d={d}
                  selected={!!selected[d.id]}
                  onToggle={toggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
