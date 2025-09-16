import { createColumnHelper } from '@tanstack/react-table';

import type { Draft } from '@/types/admin';

import {
  ImagesCell,
  SizesCell,
  ProviderCell,
  PriceCell,
  BadgeCell,
  EditableCell,
  SourceCell,
  GptRequestCell,
  GptResponseCell,
} from './DraftTableCells';

type DraftWithSelected = Draft & { selected?: boolean };

const columnHelper = createColumnHelper<DraftWithSelected>();

export function createDraftTableColumns(
  onToggle: (id: string) => void,
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>,
  onDelete: (id: string) => Promise<void>
) {
  return [
    columnHelper.display({
      id: 'select',
      header: () => '',
      cell: info => (
        <div className="flex h-full items-center justify-center">
          <input
            type="checkbox"
            checked={Boolean(info.row.original.selected)}
            onChange={() => onToggle(info.row.original.id)}
            aria-label="Выбрать черновик"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
          />
        </div>
      ),
    }),
    columnHelper.accessor('name', {
      header: () => 'Название',
      cell: info => (
        <EditableCell
          value={info.row.original.name}
          onBlur={value => onPatch(info.row.original.id, { name: value })}
          placeholder="Введите название"
          aria-label="Название"
        />
      ),
    }),
    columnHelper.accessor('article', {
      header: () => 'Артикул',
      cell: info => (
        <EditableCell
          value={info.row.original.article}
          onBlur={value => onPatch(info.row.original.id, { article: value })}
          placeholder="Введите артикул"
          aria-label="Артикул"
        />
      ),
    }),
    columnHelper.display({
      id: 'provider',
      header: () => 'Поставщик',
      cell: info => <ProviderCell provider={info.row.original.provider} />,
    }),
    columnHelper.display({
      id: 'pricePairRub',
      header: () => 'Цена/пара (₽)',
      cell: info => (
        <PriceCell
          value={info.row.original.pricePair}
          formatter={value => (value / 100).toLocaleString('ru-RU')}
        />
      ),
    }),
    columnHelper.accessor('currency', {
      header: () => 'Валюта',
      cell: info => (
        <BadgeCell
          value={info.getValue()}
          getLabel={value => value}
          bgColor="bg-blue-100 dark:bg-blue-900"
          textColor="text-blue-800 dark:text-blue-200"
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
      cell: info => (
        <PriceCell
          value={info.row.original.priceBox}
          formatter={value => (value / 100).toLocaleString('ru-RU')}
        />
      ),
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
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
      cell: info => <SizesCell sizes={info.row.original.sizes} />,
    }),
    columnHelper.display({
      id: 'images',
      header: () => 'Изображения',
      cell: info => <ImagesCell images={info.row.original.images} />,
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
      header: () => 'Действия',
      cell: info => (
        <button
          onClick={() => onDelete(info.row.original.id)}
          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Удалить черновик"
          aria-label="Удалить"
        >
          🗑️
        </button>
      ),
    }),
  ];
}
