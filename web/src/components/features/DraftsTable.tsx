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
          <div className="flex h-full items-center justify-center">
            <input
              type="checkbox"
              checked={Boolean(info.row.original.selected)}
              onChange={() => onToggle(info.row.original.id)}
              aria-label="Выбрать черновик"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
            />
          </div>
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              placeholder="Введите название"
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              placeholder="Введите артикул"
            />
          );
        },
      }),
      columnHelper.display({
        id: 'provider',
        header: () => 'Поставщик',
        cell: info => {
          const p = info.row.original.provider;
          return (
            <div className="min-w-0">
              {p ? (
                <div className="truncate">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {p.name}
                  </div>
                  {p.phone && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {p.phone}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">—</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'pricePairRub',
        header: () => 'Цена/пара (₽)',
        cell: info => (
          <div className="text-center">
            {info.row.original.pricePair != null ? (
              <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                {(info.row.original.pricePair / 100).toLocaleString('ru-RU')}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('currency', {
        header: () => 'Валюта',
        cell: info => (
          <div className="text-center">
            {info.getValue() ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {info.getValue()}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('packPairs', {
        header: () => 'Пар в упаковке',
        cell: info => (
          <div className="text-center">
            {info.getValue() ? (
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {info.getValue()}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'priceBoxRub',
        header: () => 'Цена коробки (₽)',
        cell: info => (
          <div className="text-center">
            {info.row.original.priceBox != null ? (
              <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                {(info.row.original.priceBox / 100).toLocaleString('ru-RU')}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('material', {
        header: () => 'Материал',
        cell: info => (
          <div className="text-center">
            {info.getValue() ? (
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {info.getValue()}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('gender', {
        header: () => 'Пол',
        cell: info => {
          const getGenderLabel = (value: string) => {
            const genderMap: Record<string, string> = {
              male: 'Мужской',
              female: 'Женский',
              unisex: 'Унисекс',
              men: 'Мужской',
              women: 'Женский',
              мужской: 'Мужской',
              женский: 'Женский',
              унисекс: 'Унисекс',
            };
            return genderMap[value.toLowerCase()] || value;
          };

          return (
            <div className="text-center">
              {info.getValue() ? (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {getGenderLabel(info.getValue())}
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">—</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('season', {
        header: () => 'Сезон',
        cell: info => {
          const getSeasonLabel = (value: string) => {
            const seasonMap: Record<string, string> = {
              spring: 'Весна',
              summer: 'Лето',
              autumn: 'Осень',
              fall: 'Осень',
              winter: 'Зима',
              'all-season': 'Всесезонный',
              all_season: 'Всесезонный',
              весна: 'Весна',
              лето: 'Лето',
              осень: 'Осень',
              зима: 'Зима',
              всесезонный: 'Всесезонный',
            };
            return seasonMap[value.toLowerCase()] || value;
          };

          return (
            <div className="text-center">
              {info.getValue() ? (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {getSeasonLabel(info.getValue())}
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">—</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'sizes',
        header: () => 'Размеры',
        cell: info => {
          const s = info.row.original.sizes as
            | Array<{ size: string; stock?: number; count?: number }>
            | null
            | undefined;
          if (!Array.isArray(s) || !s.length) {
            return <span className="text-gray-400 dark:text-gray-500">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {s.map((x, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {x.size}:{x.stock ?? x.count ?? 0}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'images',
        header: () => 'Изображения',
        cell: info => {
          const images = info.row.original.images || [];
          if (!images.length) {
            return <span className="text-gray-400 dark:text-gray-500">—</span>;
          }
          return (
            <div className="flex gap-1">
              {images.slice(0, 4).map(img => (
                <div
                  key={img.id}
                  className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {images.length > 4 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  +{images.length - 4}
                </div>
              )}
            </div>
          );
        },
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
    <div className="h-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="h-full overflow-auto">
        <table className="w-full min-w-max border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`whitespace-nowrap border-b border-gray-200 bg-white px-4 py-4 align-top text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${
                      header.column.id === 'material' ||
                      header.column.id === 'gender'
                        ? 'text-center'
                        : 'text-left'
                    }`}
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
          <tbody className="bg-white dark:bg-gray-900">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-900 dark:text-gray-100"
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
