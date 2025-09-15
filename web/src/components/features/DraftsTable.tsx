import * as React from 'react';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

const columnHelper = createColumnHelper<DraftWithSelected>();

// Sticky header styles - using CSS classes instead of inline styles

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
  const [localData, setLocalData] = React.useState<DraftWithSelected[]>(() =>
    data.map(d => ({ ...d, selected: !!selected[d.id] }))
  );

  React.useEffect(() => {
    setLocalData(data.map(d => ({ ...d, selected: !!selected[d.id] })));
  }, [data, selected]);

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => '',
        cell: info => (
          <input
            type="checkbox"
            checked={Boolean(info.row.original.selected)}
            onChange={() => onToggle(info.row.original.id)}
            aria-label="Выбрать черновик"
          />
        ),
      }),
      columnHelper.accessor('name', {
        header: () => 'Название',
        cell: info => {
          const [value, setValue] = React.useState(info.row.original.name);
          return (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() => onPatch(info.row.original.id, { name: value })}
              aria-label="Название"
            />
          );
        },
      }),
      columnHelper.accessor('article', {
        header: () => 'Артикул',
        cell: info => {
          const [value, setValue] = React.useState(
            info.row.original.article ?? ''
          );
          return (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={() =>
                onPatch(info.row.original.id, { article: value || null })
              }
              aria-label="Артикул"
            />
          );
        },
      }),
      columnHelper.display({
        id: 'provider',
        header: () => 'Поставщик',
        cell: info => {
          const p = info.row.original.provider;
          return p ? `${p.name}${p.phone ? ` (${p.phone})` : ''}` : '—';
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
      columnHelper.accessor('currency', {
        header: () => 'Валюта',
        cell: info => info.getValue() ?? '—',
      }),
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
        cell: info => info.getValue() ?? '—',
      }),
      columnHelper.accessor('gender', {
        header: () => 'Пол',
        cell: info => info.getValue() ?? '—',
      }),
      columnHelper.accessor('season', {
        header: () => 'Сезон',
        cell: info => info.getValue() ?? '—',
      }),
      columnHelper.display({
        id: 'sizes',
        header: () => 'Размеры',
        cell: info => {
          const s = info.row.original.sizes as
            | Array<{ size: string; stock?: number; count?: number }>
            | null
            | undefined;
          if (!Array.isArray(s) || !s.length) return '—';
          return s.map(x => `${x.size}:${x.stock ?? x.count ?? 0}`).join(', ');
        },
      }),
      columnHelper.display({
        id: 'images',
        header: () => 'Изображения',
        cell: info => (
          <div>
            {(info.row.original.images || []).slice(0, 4).map(img => (
              <img key={img.id} src={img.url} alt="" />
            ))}
          </div>
        ),
      }),
    ],
    [onToggle, onPatch]
  );

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border-b border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
        </table>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
