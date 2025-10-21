import { flexRender, Table } from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';

import { HighlightedRow } from './HighlightedRow';

interface DraftTableBodyProps {
  table: Table<Draft & { selected?: boolean }>;
  bodyRef?: React.RefObject<HTMLDivElement | null>;
  onBodyScroll?: () => void;
}

export function DraftTableBody({
  table,
  bodyRef,
  onBodyScroll,
}: DraftTableBodyProps) {
  const rows = table.getRowModel().rows;

  return (
    <div ref={bodyRef} onScroll={onBodyScroll} className="overflow-auto">
      <table className="w-full table-auto">
        <tbody className="bg-white dark:bg-gray-900">
          {rows.map(row => (
            <HighlightedRow key={row.id} draftId={row.original.id}>
              <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
                {row.getVisibleCells().map((cell, index) => {
                  const isFrozenLeft = index === 0; // First column only (select)
                  const isFrozenRight = cell.column.id === 'actions'; // Last column (actions)

                  return (
                    <td
                      key={cell.id}
                      className={`whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
                        cell.column.id === 'images' ? 'overflow-visible' : ''
                      } ${
                        isFrozenLeft
                          ? 'sticky left-0 z-10 border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                          : isFrozenRight
                            ? 'sticky right-0 z-10 border-l border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'
                            : ''
                      } ${
                        isFrozenLeft ? 'table-cell-frozen-left' : ''
                      } ${isFrozenRight ? 'table-cell-frozen-right' : ''} ${
                        (cell.column.columnDef.meta as any)?.width
                          ? 'table-cell-width'
                          : ''
                      }`}
                      style={
                        {
                          ...((cell.column.columnDef.meta as any)?.width && {
                            '--cell-width': (cell.column.columnDef.meta as any)
                              .width,
                          }),
                        } as React.CSSProperties
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
            </HighlightedRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
