import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import {
  columnHelper,
  MemoizedCategoryCell,
  MemoizedEditableCell,
  MemoizedProviderCell,
  MemoizedSourceCell,
} from './DraftTableColumnHelpers';

interface CreateBasicColumnsParams {
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  categories: CategoryNode[];
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  status?: string;
}

export function createBasicColumns({
  onToggle,
  onPatch,
  categories,
  onSelectAll,
  allSelected,
  someSelected,
  status,
}: CreateBasicColumnsParams) {
  const isApproved = status === 'approved';
  const columns = [];

  // Selection column
  if (onSelectAll && allSelected !== undefined && someSelected !== undefined) {
    columns.push(
      columnHelper.display({
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={e => onSelectAll(e.target.checked)}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <ApprovalSelectionCell
            draftId={row.original.id}
            isSelected={row.original.isSelected}
            onToggle={onToggle}
          />
        ),
      })
    );
  }

  // Name column
  columns.push(
    columnHelper.display({
      id: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <MemoizedEditableCell
          value={row.original.name}
          onSave={value => onPatch(row.original.id, { name: value })}
          placeholder="Введите название"
        />
      ),
    })
  );

  // Category column
  columns.push(
    columnHelper.display({
      id: 'category',
      header: 'Категория',
      cell: ({ row }) => (
        <MemoizedCategoryCell
          categoryId={row.original.categoryId}
          categories={categories}
          onPatch={onPatch}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Provider column
  columns.push(
    columnHelper.display({
      id: 'provider',
      header: 'Поставщик',
      cell: ({ row }) => (
        <MemoizedProviderCell
          providerId={row.original.providerId}
          onPatch={onPatch}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Source column
  columns.push(
    columnHelper.display({
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => (
        <MemoizedSourceCell
          source={row.original.source}
          draftId={row.original.id}
        />
      ),
    })
  );

  return columns;
}
