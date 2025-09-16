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

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        // Optimistic UI: immediately remove from local state
        setLocalData(prev => prev.filter(item => item.id !== id));

        // Update in database
        await fetch('/api/admin/drafts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            data: { isDeleted: true },
          }),
        });
      } catch (e) {
        console.error('Failed to delete draft', e);
        // Revert optimistic update on error
        setLocalData(data.map(d => ({ ...d, selected: !!selected[d.id] })));
      }
    },
    [data, selected]
  );

  const columns = React.useMemo(
    () => createDraftTableColumns(onToggle, onPatch, handleDelete),
    [onToggle, onPatch, handleDelete]
  );

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="h-full overflow-auto">
        <div className="relative min-w-full">
          <table className="w-full min-w-[1200px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-lg">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isFrozenLeft = index === 0; // First column only (select)
                    const isFrozenRight = header.column.id === 'actions'; // Last column (actions)

                    return (
                      <th
                        key={header.id}
                        className={`whitespace-nowrap border-b border-gray-200 bg-white px-4 py-4 align-top text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${
                          header.column.id === 'material' ||
                          header.column.id === 'gender'
                            ? 'text-center'
                            : 'text-left'
                        } ${
                          isFrozenLeft
                            ? 'sticky left-0 z-30 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                            : isFrozenRight
                              ? 'sticky right-0 z-30 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                              : 'relative z-20'
                        }`}
                        style={
                          isFrozenLeft
                            ? { left: 0 } // Select column: 0px
                            : isFrozenRight
                              ? { right: 0 }
                              : {}
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isFrozenLeft = index === 0; // First column only (select)
                    const isFrozenRight = cell.column.id === 'actions'; // Last column (actions)

                    return (
                      <td
                        key={cell.id}
                        className={`whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-900 dark:text-gray-100 ${
                          isFrozenLeft
                            ? 'sticky left-0 z-10 border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                            : isFrozenRight
                              ? 'sticky right-0 z-10 border-l border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                              : ''
                        }`}
                        style={
                          isFrozenLeft
                            ? { left: 0 } // Select column: 0px
                            : isFrozenRight
                              ? { right: 0 }
                              : {}
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
