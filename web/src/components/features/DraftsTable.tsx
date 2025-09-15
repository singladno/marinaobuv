import { useMemo, useState } from 'react';
import type { Draft } from '@/types/admin';
import { Input } from '@/components/ui/Input';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

export function DraftsTable({
  data,
  selected,
  onToggle,
  onPatch,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
}) {
  const columnHelper = createColumnHelper<Draft & { selected?: boolean }>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => '',
        cell: info => (
          <input
            aria-label="Выбрать черновик"
            type="checkbox"
            checked={Boolean((info.row.original as any).selected)}
            onChange={() => onToggle(info.row.original.id)}
          />
        ),
        size: 32,
      }),
      columnHelper.accessor('name', {
        header: () => 'Название',
        cell: info => {
          const row = info.row.original;
          const [value, setValue] = useState(row.name);
          return (
            <Input
              aria-label="Название"
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() => onPatch(row.id, { name: value })}
            />
          );
        },
        size: 280,
      }),
      columnHelper.accessor('article', {
        header: () => 'Артикул',
        cell: info => {
          const row = info.row.original;
          const [value, setValue] = useState(row.article ?? '');
          return (
            <Input
              aria-label="Артикул"
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() => onPatch(row.id, { article: value || null })}
            />
          );
        },
        size: 160,
      }),
      columnHelper.display({
        id: 'provider',
        header: () => 'Поставщик',
        cell: info => {
          const p = info.row.original.provider;
          return p ? (
            <div
              className="max-w-[220px] truncate"
              title={`${p.name}${p.phone ? ` (${p.phone})` : ''}`}
            >
              {p.name}
              {p.phone ? ` (${p.phone})` : ''}
            </div>
          ) : (
            '—'
          );
        },
      }),
      columnHelper.display({
        id: 'pricePairRub',
        header: () => 'Цена/пара (₽)',
        cell: info =>
          info.row.original.pricePair != null
            ? (info.row.original.pricePair / 100).toLocaleString('ru-RU')
            : '—',
      }),
      columnHelper.accessor('currency', { header: () => 'Валюта' }),
      columnHelper.accessor('packPairs', {
        header: () => 'Пар в упаковке',
        cell: info => info.getValue() ?? '—',
      }),
      columnHelper.display({
        id: 'priceBoxRub',
        header: () => 'Цена коробки (₽)',
        cell: info =>
          info.row.original.priceBox != null
            ? (info.row.original.priceBox / 100).toLocaleString('ru-RU')
            : '—',
      }),
      columnHelper.accessor('material', {
        header: () => 'Материал',
        cell: i => i.getValue() ?? '—',
      }),
      columnHelper.accessor('gender', {
        header: () => 'Пол',
        cell: i => i.getValue() ?? '—',
      }),
      columnHelper.accessor('season', {
        header: () => 'Сезон',
        cell: i => i.getValue() ?? '—',
      }),
      columnHelper.display({
        id: 'sizes',
        header: () => 'Размеры',
        cell: info => {
          const s = info.row.original.sizes as any[] | null | undefined;
          if (!Array.isArray(s) || !s.length) return '—';
          const text = s
            .map(
              (x: any) =>
                `${x.size}:${(x as any).stock ?? (x as any).count ?? 0}`
            )
            .join(', ');
          return (
            <div className="max-w-[220px] truncate" title={text}>
              {text}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'images',
        header: () => 'Изображения',
        cell: info => (
          <div className="flex gap-1 overflow-x-auto">
            {(info.row.original.images || []).slice(0, 4).map(img => (
              <img
                key={img.id}
                src={img.url}
                className="h-10 w-10 rounded object-cover"
                alt=""
              />
            ))}
          </div>
        ),
      }),
    ],
    [onPatch, onToggle]
  );

  const tableData = useMemo(
    () => data.map(d => ({ ...d, selected: !!selected[d.id] })),
    [data, selected]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full text-sm">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id} className="border-b text-left">
            {headerGroup.headers.map(header => (
              <th key={header.id} className="p-2">
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id} className="border-b">
            {row.getVisibleCells().map(cell => (
              <td key={cell.id} className="p-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
