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
              if (el)
                (el as HTMLInputElement).indeterminate = Boolean(
                  someSelected && !allSelected
                );
            }}
            onChange={e => onSelectAll(e.target.checked)}
            className="rounded border-gray-300"
            aria-label="Выбрать все черновики"
          />
        ),
        cell: ({ row }) => (
          <ApprovalSelectionCell
            id={row.original.id}
            selected={Boolean((row.original as any).isSelected)}
            onToggle={onToggle}
            approvalState={null}
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
          onBlur={value => onPatch(row.original.id, { name: value })}
          placeholder="Введите название"
          aria-label="Название товара"
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
          category={row.original.category}
          categoryId={row.original.categoryId}
          onCategoryChange={categoryId =>
            onPatch(row.original.id, { categoryId })
          }
          categories={categories}
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
        <MemoizedProviderCell provider={row.original.provider} />
      ),
    })
  );

  // Source column
  columns.push(
    columnHelper.display({
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => <MemoizedSourceCell source={row.original.source} />,
    })
  );

  return columns;
}
