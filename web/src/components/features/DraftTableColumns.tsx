import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { ImagesCell } from './DraftTableCells';
import { SizesCell } from './SizesCell';
import { ProviderCell } from './ProviderCell';
import { PriceCell } from './PriceCell';
import { BadgeCell } from './BadgeCell';
import { EditableCell } from './EditableCell';
import { EditablePriceCell } from './EditablePriceCell';
import { EditableNumberCell } from './EditableNumberCell';
import { SourceCell } from './SourceCell';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { CategoryCell } from './CategoryCell';
import { GenderSelectCell } from './GenderSelectCell';
import { SeasonSelectCell } from './SeasonSelectCell';

type DraftWithSelected = Draft & { selected?: boolean };

const columnHelper = createColumnHelper<DraftWithSelected>();

// Memoized checkbox component to prevent unnecessary re-renders
const SelectionCheckbox = React.memo(
  ({
    id,
    selected,
    onToggle,
  }: {
    id: string;
    selected: boolean;
    onToggle: (id: string) => void;
  }) => {
    const handleChange = React.useCallback(() => {
      onToggle(id);
    }, [id, onToggle]);

    return (
      <div className="flex h-full items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleChange}
          aria-label="Выбрать черновик"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.onToggle === nextProps.onToggle
    );
  }
);

SelectionCheckbox.displayName = 'SelectionCheckbox';

// Memoized cell components to prevent re-renders
const MemoizedEditableCell = React.memo(EditableCell);
const MemoizedEditablePriceCell = React.memo(EditablePriceCell);
const MemoizedEditableNumberCell = React.memo(EditableNumberCell);
const MemoizedCategoryCell = React.memo(CategoryCell);
const MemoizedProviderCell = React.memo(ProviderCell);
const MemoizedPriceCell = React.memo(PriceCell);
const MemoizedSizesCell = React.memo(SizesCell);
const MemoizedImagesCell = React.memo(ImagesCell);
const MemoizedBadgeCell = React.memo(BadgeCell);
const MemoizedSourceCell = React.memo(SourceCell);
const MemoizedGptRequestCell = React.memo(GptRequestCell);
const MemoizedGptResponseCell = React.memo(GptResponseCell);
const MemoizedGenderSelectCell = React.memo(GenderSelectCell);
const MemoizedSeasonSelectCell = React.memo(SeasonSelectCell);

// Memoized formatters to avoid recreation on every render
const priceFormatter = (value: number) => (value / 100).toLocaleString('ru-RU');

export function createDraftTableColumns(
  onToggle: (id: string) => void,
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>,
  categories: CategoryNode[],
  onReload?: () => void,
  onSelectAll?: (selectAll: boolean) => void,
  allSelected?: boolean,
  someSelected?: boolean,
  status?: string
) {
  const isDraft = status === 'draft' || !status;
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
        <SelectionCheckbox
          id={info.row.original.id}
          selected={Boolean(info.row.original.selected)}
          onToggle={onToggle}
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
  } else {
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

  // Add price columns
  columns.push(
    columnHelper.display({
      id: 'pricePairRub',
      header: () => 'Цена/пара (₽)',
      cell: info => (
        <MemoizedEditablePriceCell
          value={info.row.original.pricePair}
          onBlur={value => onPatch(info.row.original.id, { pricePair: value })}
          placeholder="Введите цену"
          aria-label="Цена за пару"
          disabled={(info as any).isProcessing}
        />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'packPairs',
      header: () => 'Пар в упаковке',
      cell: info => (
        <MemoizedEditableNumberCell
          value={info.row.original.packPairs}
          onBlur={value => onPatch(info.row.original.id, { packPairs: value })}
          placeholder="Введите количество"
          aria-label="Пар в упаковке"
          min={1}
          disabled={(info as any).isProcessing}
        />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'priceBoxRub',
      header: () => 'Цена коробки (₽)',
      cell: info => {
        const { pricePair, packPairs, providerDiscount } = info.row.original;

        // Calculate box price: (pair price × pairs count in box) - provider discount
        let calculatedBoxPrice: number | null = null;

        if (pricePair !== null && packPairs !== null) {
          calculatedBoxPrice = pricePair * packPairs;

          // Subtract provider discount if available
          if (providerDiscount !== null) {
            calculatedBoxPrice -= providerDiscount;
          }
        }

        return (
          <PriceCell
            value={calculatedBoxPrice}
            formatter={value => (value / 100).toLocaleString('ru-RU')}
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
        <MemoizedEditablePriceCell
          value={info.row.original.providerDiscount}
          onBlur={value =>
            onPatch(info.row.original.id, { providerDiscount: value })
          }
          placeholder="Введите скидку"
          aria-label="Скидка поставщика"
          disabled={(info as any).isProcessing}
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
          <MemoizedEditableCell
            value={info.row.original.material}
            onBlur={value => onPatch(info.row.original.id, { material: value })}
            placeholder="Введите материал"
            aria-label="Материал"
          />
        ),
      })
    );

    columns.push(
      columnHelper.display({
        id: 'gender',
        header: () => 'Пол',
        cell: info => {
          return (
            <MemoizedGenderSelectCell
              value={info.row.original.gender}
              onChange={value =>
                onPatch(info.row.original.id, { gender: value })
              }
            />
          );
        },
      })
    );

    columns.push(
      columnHelper.display({
        id: 'season',
        header: () => 'Сезон',
        cell: info => {
          return (
            <MemoizedSeasonSelectCell
              value={info.row.original.season}
              onChange={value =>
                onPatch(info.row.original.id, { season: value })
              }
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
          <MemoizedSizesCell
            sizes={info.row.original.sizes}
            onChange={next => {
              onPatch(info.row.original.id, { sizes: next });
            }}
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
        <ImagesCell
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
    })
  );
  return columns;
}
