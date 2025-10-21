import * as React from 'react';
import type { Row, Table } from '@tanstack/react-table';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import {
  MemoizedCategoryCell,
  MemoizedSourceCell,
} from './DraftTableColumnHelpers';

export function createBasicColumns(
  categories: CategoryNode[],
  onToggle?: (id: string) => void,
  getApprovalState?: (id: string) => { isProcessing: boolean }
) {
  return [
    {
      id: 'select',
      header: ({ table }: { table: Table<Draft> }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={e => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Выбрать все строки на странице"
          title="Выбрать все"
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }: { row: Row<Draft> }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={e => row.toggleSelected(!!e.target.checked)}
          aria-label="Выбрать строку"
          title="Выбрать"
          className="rounded border-gray-300"
        />
      ),
    },
    {
      id: 'images',
      header: 'Фото',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedSourceCell source={row.original.source} />
      ),
    },
    {
      id: 'source',
      header: 'Источник',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedSourceCell source={row.original.source} />
      ),
    },
    {
      id: 'category',
      header: 'Категория',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedCategoryCell
          category={row.original.category}
          categoryId={row.original.categoryId}
          onCategoryChange={async () => {}}
          categories={categories}
        />
      ),
    },
    {
      id: 'approval',
      header: 'Одобрение',
      cell: ({ row }: { row: Row<Draft> }) => (
        <ApprovalSelectionCell
          id={row.original.id}
          selected={(row.original as any).selected || false}
          onToggle={onToggle || (() => {})}
          approvalState={
            getApprovalState
              ? {
                  isProcessing: getApprovalState(row.original.id).isProcessing,
                  currentImage: 0,
                  totalImages: 0,
                  progress: 0,
                  status: 'idle' as const,
                }
              : null
          }
        />
      ),
    },
  ];
}
