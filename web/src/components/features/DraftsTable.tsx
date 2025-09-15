import { useMemo, useState } from 'react';
import type { Draft } from '@/types/admin';
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
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
            <input
              aria-label="Название"
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() => onPatch(row.id, { name: value })}
              className="w-full rounded border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <input
              aria-label="Артикул"
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() => onPatch(row.id, { article: value || null })}
              className="w-full rounded border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p
              className="whitespace-no-wrap max-w-[220px] truncate text-gray-900"
              title={`${p.name}${p.phone ? ` (${p.phone})` : ''}`}
            >
              {p.name}
              {p.phone ? ` (${p.phone})` : ''}
            </p>
          ) : (
            <p className="text-gray-500">—</p>
          );
        },
      }),
      columnHelper.display({
        id: 'pricePairRub',
        header: () => 'Цена/пара (₽)',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.row.original.pricePair != null
              ? (info.row.original.pricePair / 100).toLocaleString('ru-RU')
              : '—'}
          </p>
        ),
      }),
      columnHelper.accessor('currency', {
        header: () => 'Валюта',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.getValue() ?? '—'}
          </p>
        ),
      }),
      columnHelper.accessor('packPairs', {
        header: () => 'Пар в упаковке',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.getValue() ?? '—'}
          </p>
        ),
      }),
      columnHelper.display({
        id: 'priceBoxRub',
        header: () => 'Цена коробки (₽)',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.row.original.priceBox != null
              ? (info.row.original.priceBox / 100).toLocaleString('ru-RU')
              : '—'}
          </p>
        ),
      }),
      columnHelper.accessor('material', {
        header: () => 'Материал',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.getValue() ?? '—'}
          </p>
        ),
      }),
      columnHelper.accessor('gender', {
        header: () => 'Пол',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.getValue() ?? '—'}
          </p>
        ),
      }),
      columnHelper.accessor('season', {
        header: () => 'Сезон',
        cell: info => (
          <p className="whitespace-no-wrap text-gray-900">
            {info.getValue() ?? '—'}
          </p>
        ),
      }),
      columnHelper.display({
        id: 'sizes',
        header: () => 'Размеры',
        cell: info => {
          const s = info.row.original.sizes as any[] | null | undefined;
          if (!Array.isArray(s) || !s.length)
            return <p className="text-gray-500">—</p>;
          const text = s
            .map(
              (x: any) =>
                `${x.size}:${(x as any).stock ?? (x as any).count ?? 0}`
            )
            .join(', ');
          return (
            <p
              className="whitespace-no-wrap max-w-[220px] truncate text-gray-900"
              title={text}
            >
              {text}
            </p>
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
                className="h-8 w-8 rounded object-cover"
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
    <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
      <table className="min-w-full leading-normal">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
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
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                index === table.getRowModel().rows.length - 1
                  ? ''
                  : 'border-b border-gray-200'
              }
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="bg-white px-5 py-5 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
