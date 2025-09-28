import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import {
  columnHelper,
  MemoizedCategoryCell,
  MemoizedEditableCell,
  MemoizedProviderCell,
  MemoizedSourceCell,
} from './DraftTableColumnHelpers';
import { ApprovalSelectionCell } from './ApprovalSelectionCell';

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

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () =>
        onSelectAll ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected || false}
              ref={input => {
                if (input)
                  input.indeterminate =
                    (someSelected || false) && !(allSelected || false);
              }}
              onChange={e => onSelectAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              title={allSelected ? 'Снять выделение со всех' : 'Выделить все'}
            />
          </div>
        ) : (
          ''
        ),
      cell: info => (
        <ApprovalSelectionCell
          id={info.row.original.id}
          selected={Boolean(info.row.original.selected)}
          onToggle={onToggle}
          approvalState={{
            isProcessing: false,
            currentImage: 0,
            totalImages: 0,
            progress: 0,
            status: 'idle',
          }}
        />
      ),
    }),
  ];

  // Only add name column for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'name',
        header: () => 'Название',
        cell: info => (
          <MemoizedEditableCell
            value={info.row.original.name}
            onBlur={value => onPatch(info.row.original.id, { name: value })}
            placeholder="Введите название"
            aria-label="Название"
            disabled={(info as any).isProcessing}
          />
        ),
      })
    );
  }

  // Add article column - always visible, non-editable
  columns.push(
    columnHelper.display({
      id: 'article',
      header: () => 'Артикул',
      cell: info => (
        <div className="px-2 py-1 text-sm text-gray-900 dark:text-gray-100">
          {info.row.original.article || '—'}
        </div>
      ),
    })
  );

  // Add category column only for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'category',
        header: () => 'Категория',
        cell: info => (
          <MemoizedCategoryCell
            category={info.row.original.category}
            categoryId={info.row.original.categoryId}
            onCategoryChange={value =>
              onPatch(info.row.original.id, { categoryId: value })
            }
            categories={categories}
          />
        ),
      })
    );
  }

  // Add provider column
  columns.push(
    columnHelper.display({
      id: 'provider',
      header: () => 'Поставщик',
      cell: info => (
        <MemoizedProviderCell provider={info.row.original.provider} />
      ),
    })
  );

  // Add source column
  columns.push(
    columnHelper.display({
      id: 'source',
      header: () => 'Источник',
      cell: info => <MemoizedSourceCell source={info.row.original.source} />,
    })
  );

  return columns;
}
