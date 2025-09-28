import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';
import {
  calculateTotalPairs,
  calculateBoxPrice,
} from '@/utils/sizeCalculations';

import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import { CategoryCell } from './CategoryCell';
import { GenderSelectCell } from './GenderSelectCell';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { OptimisticEditableCell } from './OptimisticEditableCell';
import { OptimisticImagesCell } from './OptimisticImagesCell';
import { OptimisticSizesCell } from './OptimisticSizesCell';
import { PriceCell } from './PriceCell';
import { ProviderCell } from './ProviderCell';
import { SeasonSelectCell } from './SeasonSelectCell';
import { SourceCell } from './SourceCell';

type DraftWithSelected = Draft;

const columnHelper = createColumnHelper<DraftWithSelected>();

// Memoized cell components to prevent re-renders
const MemoizedOptimisticEditableCell = React.memo(OptimisticEditableCell);
const MemoizedSourceCell = React.memo(SourceCell);
const MemoizedOptimisticSizesCell = React.memo(OptimisticSizesCell);
const MemoizedCategoryCell = React.memo(CategoryCell);
const MemoizedProviderCell = React.memo(ProviderCell);
const MemoizedGenderSelectCell = React.memo(GenderSelectCell);
const MemoizedSeasonSelectCell = React.memo(SeasonSelectCell);

interface CreateOptimisticDraftTableColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
  onToggle?: (id: string) => void;
  getApprovalState?: (id: string) => { isProcessing: boolean };
}

export function createOptimisticDraftTableColumns({
  onPatch,
  onDelete,
  onImageToggle,
  categories,
  onReload,
  status,
  onToggle,
  getApprovalState,
}: CreateOptimisticDraftTableColumnsParams) {
  const isApproved = status === 'approved';

  // Helper function to check if a row is disabled (being approved)
  const isRowDisabled = (draftId: string) => {
    return getApprovalState?.(draftId)?.isProcessing ?? false;
  };

  // Helper function to get row class based on disabled state
  const getRowClass = (draftId: string) => {
    return isRowDisabled(draftId)
      ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50'
      : '';
  };

  // Add a meta property to the first column to store row styling info
  const addRowMeta = (columns: any[]) => {
    if (columns.length > 0) {
      columns[0].meta = {
        ...columns[0].meta,
        getRowClass: (row: any) => getRowClass(row.original.id),
      };
    }
    return columns;
  };

  const columns = [
    // TanStack Table's built-in selection column
    columnHelper.display({
      id: 'select',
      header: ({ table }) => {
        const isAllSelected = table.getIsAllRowsSelected();
        const isSomeSelected = table.getIsSomeRowsSelected();

        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) {
                  input.indeterminate = isSomeSelected && !isAllSelected;
                }
              }}
              onChange={e => table.toggleAllRowsSelected(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
              title={isAllSelected ? 'Снять выделение со всех' : 'Выделить все'}
              aria-label={
                isAllSelected ? 'Снять выделение со всех' : 'Выделить все'
              }
            />
          </div>
        );
      },
      cell: ({ row }) => {
        // Use simple checkbox for approved status, approval cell for other statuses
        if (isApproved) {
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={e => row.toggleSelected(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                title={row.getIsSelected() ? 'Снять выделение' : 'Выделить'}
                aria-label={
                  row.getIsSelected() ? 'Снять выделение' : 'Выделить'
                }
              />
            </div>
          );
        }

        return (
          <ApprovalSelectionCell
            id={row.original.id}
            selected={row.getIsSelected()}
            onToggle={onToggle || (() => {})}
            approvalState={null} // No longer using approval events
          />
        );
      },
      meta: {
        frozen: 'left',
      },
    }),
  ];

  // Only add name column for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'name',
        header: () => 'Название',
        cell: info => (
          <MemoizedOptimisticEditableCell
            value={info.row.original.name}
            onSave={value => onPatch(info.row.original.id, { name: value })}
            placeholder="Введите название"
            aria-label="Название"
            disabled={isRowDisabled(info.row.original.id)}
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
            disabled={isRowDisabled(info.row.original.id)}
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
      id: 'sourceOptimistic',
      header: () => 'Источник',
      cell: info => <MemoizedSourceCell source={info.row.original.source} />,
    })
  );

  // Add price columns
  columns.push(
    columnHelper.display({
      id: 'pricePairRub',
      header: () => 'Цена/пара (₽)',
      cell: info => (
        <MemoizedOptimisticEditableCell
          value={info.row.original.pricePair}
          onSave={value => onPatch(info.row.original.id, { pricePair: value })}
          placeholder="Введите цену"
          aria-label="Цена"
          type="price"
          disabled={isRowDisabled(info.row.original.id)}
        />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'packPairs',
      header: () => 'Пар в упаковке',
      cell: info => {
        const { sizes } = info.row.original;
        const totalPairs = calculateTotalPairs(sizes);

        return (
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {totalPairs}
            </span>
          </div>
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'priceBoxRub',
      header: () => 'Цена коробки (₽)',
      cell: info => {
        const { pricePair, sizes } = info.row.original;
        const totalPairs = calculateTotalPairs(sizes);
        const calculatedBoxPrice = calculateBoxPrice(pricePair, totalPairs);

        return (
          <PriceCell
            value={calculatedBoxPrice}
            formatter={value => value.toLocaleString('ru-RU')}
          />
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'providerDiscountRub',
      header: () => 'Скидка поставщика (₽)',
      cell: info => (
        <MemoizedOptimisticEditableCell
          value={info.row.original.providerDiscount}
          onSave={value =>
            onPatch(info.row.original.id, { providerDiscount: value })
          }
          placeholder="Введите скидку"
          aria-label="Скидка поставщика"
          type="price"
          disabled={isRowDisabled(info.row.original.id)}
        />
      ),
    })
  );

  // Only add material, gender, season columns for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'material',
        header: () => 'Материал',
        cell: info => (
          <MemoizedOptimisticEditableCell
            value={info.row.original.material}
            onSave={value => onPatch(info.row.original.id, { material: value })}
            placeholder="Введите материал"
            aria-label="Материал"
            disabled={isRowDisabled(info.row.original.id)}
          />
        ),
      })
    );

    columns.push(
      columnHelper.display({
        id: 'description',
        header: () => 'Описание',
        cell: info => (
          <MemoizedOptimisticEditableCell
            value={info.row.original.description}
            onSave={value =>
              onPatch(info.row.original.id, { description: value })
            }
            placeholder="Введите описание"
            aria-label="Описание"
            disabled={isRowDisabled(info.row.original.id)}
          />
        ),
      })
    );

    columns.push(
      columnHelper.display({
        id: 'gender',
        header: () => 'Пол',
        size: 180,
        meta: {
          width: '180px',
        },
        cell: info => {
          return (
            <MemoizedGenderSelectCell
              value={info.row.original.gender}
              onChange={value =>
                onPatch(info.row.original.id, { gender: value })
              }
              disabled={isRowDisabled(info.row.original.id)}
            />
          );
        },
      })
    );

    columns.push(
      columnHelper.display({
        id: 'season',
        header: () => 'Сезон',
        size: 180,
        meta: {
          width: '180px',
        },
        cell: info => {
          return (
            <MemoizedSeasonSelectCell
              value={info.row.original.season}
              onChange={value =>
                onPatch(info.row.original.id, { season: value })
              }
              disabled={isRowDisabled(info.row.original.id)}
            />
          );
        },
      })
    );
  }

  // Add remaining columns
  columns.push(
    columnHelper.display({
      id: 'sizes',
      header: () => 'Размеры',
      cell: info => {
        return (
          <MemoizedOptimisticSizesCell
            sizes={info.row.original.sizes}
            onChange={next => {
              onPatch(info.row.original.id, { sizes: next });
            }}
            disabled={isRowDisabled(info.row.original.id)}
          />
        );
      },
    })
  );

  // Add AI status column for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'aiStatus',
        header: () => 'AI Статус',
        cell: info => {
          const aiStatus = info.row.original.aiStatus;
          const aiProcessedAt = info.row.original.aiProcessedAt;

          if (!aiStatus) {
            return <span className="text-gray-400 dark:text-gray-500">—</span>;
          }

          const getStatusColor = (status: string) => {
            switch (status) {
              case 'ai_processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
              case 'ai_completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
              case 'ai_failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
              default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            }
          };

          const getStatusLabel = (status: string) => {
            switch (status) {
              case 'ai_processing':
                return 'Обрабатывается';
              case 'ai_completed':
                return 'Завершено';
              case 'ai_failed':
                return 'Ошибка';
              default:
                return status;
            }
          };

          return (
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(aiStatus)}`}
              >
                {aiStatus === 'ai_processing' && (
                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {getStatusLabel(aiStatus)}
              </span>
              {aiProcessedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(aiProcessedAt).toLocaleTimeString('ru-RU')}
                </span>
              )}
            </div>
          );
        },
      })
    );
  }

  columns.push(
    columnHelper.display({
      id: 'images',
      header: () => 'Изображения',
      cell: info => (
        <OptimisticImagesCell
          draftId={info.row.original.id}
          images={info.row.original.images}
          onImageToggle={onImageToggle}
          onReload={onReload}
        />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'source',
      header: () => 'Источник',
      cell: info => <SourceCell source={info.row.original.source} />,
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptRequest',
      header: () => 'GPT Запрос',
      cell: info => (
        <GptRequestCell gptRequest={info.row.original.gptRequest} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptResponse',
      header: () => 'GPT Ответ',
      cell: info => (
        <GptResponseCell rawGptResponse={info.row.original.rawGptResponse} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptRequest2',
      header: () => 'GPT Запрос 2',
      cell: info => (
        <GptRequestCell gptRequest={info.row.original.gptRequest2} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptResponse2',
      header: () => 'GPT Ответ 2',
      cell: info => (
        <GptResponseCell rawGptResponse={info.row.original.rawGptResponse2} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'createdAt',
      header: () => 'Создано',
      cell: info => {
        const value = info.row.original.createdAt;
        if (!value)
          return <span className="text-gray-400 dark:text-gray-500">—</span>;

        const date = new Date(value);
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {date.toLocaleDateString('ru-RU')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {date.toLocaleTimeString('ru-RU')}
            </div>
          </div>
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'updatedAt',
      header: () => 'Обновлено',
      cell: info => {
        const value = info.row.original.updatedAt;
        if (!value)
          return <span className="text-gray-400 dark:text-gray-500">—</span>;

        const date = new Date(value);
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {date.toLocaleDateString('ru-RU')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {date.toLocaleTimeString('ru-RU')}
            </div>
          </div>
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'actions',
      header: () => '',
      cell: info => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => onDelete(info.row.original.id)}
            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            title="Удалить черновик"
            aria-label="Удалить"
          >
            🗑️
          </button>
        </div>
      ),
      meta: {
        frozen: 'right',
      },
    })
  );

  return addRowMeta(columns);
}
