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
import { SourceCell } from './SourceCell';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { CategoryCell } from './CategoryCell';

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
const MemoizedCategoryCell = React.memo(CategoryCell);
const MemoizedProviderCell = React.memo(ProviderCell);
const MemoizedPriceCell = React.memo(PriceCell);
const MemoizedSizesCell = React.memo(SizesCell);
const MemoizedImagesCell = React.memo(ImagesCell);
const MemoizedBadgeCell = React.memo(BadgeCell);
const MemoizedSourceCell = React.memo(SourceCell);
const MemoizedGptRequestCell = React.memo(GptRequestCell);
const MemoizedGptResponseCell = React.memo(GptResponseCell);

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
  someSelected?: boolean
) {
  return [
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
    columnHelper.accessor('name', {
      header: () => 'Название',
      cell: info => (
        <MemoizedEditableCell
          value={info.row.original.name}
          onBlur={value => onPatch(info.row.original.id, { name: value })}
          placeholder="Введите название"
          aria-label="Название"
        />
      ),
    }),
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
    }),
    columnHelper.display({
      id: 'provider',
      header: () => 'Поставщик',
      cell: info => (
        <MemoizedProviderCell provider={info.row.original.provider} />
      ),
    }),
    columnHelper.display({
      id: 'pricePairRub',
      header: () => 'Цена/пара (₽)',
      cell: info => (
        <MemoizedPriceCell
          value={info.row.original.pricePair}
          formatter={priceFormatter}
        />
      ),
    }),
    columnHelper.accessor('packPairs', {
      header: () => 'Пар в упаковке',
      cell: info => (
        <div className="text-center">
          {info.getValue() ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {info.getValue()}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">—</span>
          )}
        </div>
      ),
    }),
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
    }),
    columnHelper.display({
      id: 'providerDiscountRub',
      header: () => 'Скидка поставщика (₽)',
      cell: info => (
        <PriceCell
          value={info.row.original.providerDiscount}
          formatter={value => (value / 100).toLocaleString('ru-RU')}
        />
      ),
    }),
    columnHelper.accessor('material', {
      header: () => 'Материал',
      cell: info => (
        <div className="text-center">
          {info.getValue() ? (
            <span className="break-words text-sm font-medium text-gray-900 dark:text-gray-100">
              {info.getValue()}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">—</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('gender', {
      header: () => 'Пол',
      cell: info => {
        const getGenderLabel = (value: string) => {
          const genderMap: Record<string, string> = {
            male: 'Мужской',
            female: 'Женский',
            unisex: 'Унисекс',
            men: 'Мужской',
            women: 'Женский',
            мужской: 'Мужской',
            женский: 'Женский',
            унисекс: 'Унисекс',
          };
          return genderMap[value.toLowerCase()] || value;
        };

        return (
          <BadgeCell
            value={info.getValue()}
            getLabel={getGenderLabel}
            bgColor="bg-purple-100 dark:bg-purple-900"
            textColor="text-purple-800 dark:text-purple-200"
          />
        );
      },
    }),
    columnHelper.accessor('season', {
      header: () => 'Сезон',
      cell: info => {
        const getSeasonLabel = (value: string) => {
          const seasonMap: Record<string, string> = {
            spring: 'Весна',
            summer: 'Лето',
            autumn: 'Осень',
            fall: 'Осень',
            winter: 'Зима',
            'all-season': 'Всесезонный',
            all_season: 'Всесезонный',
            весна: 'Весна',
            лето: 'Лето',
            осень: 'Осень',
            зима: 'Зима',
            всесезонный: 'Всесезонный',
          };
          return seasonMap[value.toLowerCase()] || value;
        };

        return (
          <BadgeCell
            value={info.getValue()}
            getLabel={getSeasonLabel}
            bgColor="bg-orange-100 dark:bg-orange-900"
            textColor="text-orange-800 dark:text-orange-200"
          />
        );
      },
    }),
    columnHelper.display({
      id: 'sizes',
      header: () => 'Размеры',
      cell: info => (
        <SizesCell
          sizes={info.row.original.sizes}
          onChange={next => onPatch(info.row.original.id, { sizes: next })}
        />
      ),
    }),
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
    }),
    columnHelper.display({
      id: 'source',
      header: () => 'Источник',
      cell: info => <SourceCell source={info.row.original.source} />,
    }),
    columnHelper.display({
      id: 'gptRequest',
      header: () => 'GPT Запрос',
      cell: info => (
        <GptRequestCell gptRequest={info.row.original.gptRequest} />
      ),
    }),
    columnHelper.display({
      id: 'gptResponse',
      header: () => 'GPT Ответ',
      cell: info => (
        <GptResponseCell rawGptResponse={info.row.original.rawGptResponse} />
      ),
    }),
    // GPT2 columns hidden for now
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
    }),
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
    }),
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
    }),
  ];
}
