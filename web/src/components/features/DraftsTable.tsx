import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';

import { createDraftTableColumns } from './DraftTableColumns';

type DraftWithSelected = Draft & { selected?: boolean };

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
    () => createDraftTableColumns(onToggle, onPatch),
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
