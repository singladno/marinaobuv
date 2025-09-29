import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';

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
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={e => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Выбрать все строки на странице"
          title="Выбрать все"
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
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
      cell: ({ row }) => (
        <MemoizedSourceCell
          draft={row.original}
          onImageToggle={async () => {}}
        />
      ),
    },
    {
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => (
        <MemoizedSourceCell
          draft={row.original}
          onImageToggle={async () => {}}
        />
      ),
    },
    {
      id: 'category',
      header: 'Категория',
      cell: ({ row }) => (
        <MemoizedCategoryCell
          draft={row.original}
          categories={categories}
          onPatch={async () => {}}
        />
      ),
    },
    {
      id: 'approval',
      header: 'Одобрение',
      cell: ({ row }) => (
        <ApprovalSelectionCell
          draft={row.original}
          onToggle={onToggle}
          getApprovalState={getApprovalState}
        />
      ),
    },
  ];
}
