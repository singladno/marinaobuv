import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';
import type { VisibilityState } from '@tanstack/react-table';

export function createColumnConfigs(
  columnVisibility: VisibilityState
): ColumnConfig[] {
  return [
    { id: 'select', label: 'Выбор', visible: true, required: true },
    { id: 'name', label: 'Название', visible: true, required: true },
    { id: 'category', label: 'Категория', visible: true, required: true },
    { id: 'provider', label: 'Поставщик', visible: true, required: true },
    {
      id: 'pricePairRub',
      label: 'Цена/пара (₽)',
      visible: true,
      required: true,
    },
    { id: 'currency', label: 'Валюта', visible: true, required: true },
    {
      id: 'packPairs',
      label: 'Пар в упаковке',
      visible: true,
      required: true,
    },
    {
      id: 'priceBoxRub',
      label: 'Цена коробки (₽)',
      visible: true,
      required: true,
    },
    {
      id: 'providerDiscountRub',
      label: 'Скидка поставщика (₽)',
      visible: true,
      required: true,
    },
    { id: 'material', label: 'Материал', visible: true, required: true },
    { id: 'gender', label: 'Пол', visible: true, required: true },
    { id: 'season', label: 'Сезон', visible: true, required: true },
    { id: 'sizes', label: 'Размеры', visible: true, required: true },
    { id: 'images', label: 'Изображения', visible: true, required: true },
    { id: 'source', label: 'Источник', visible: true, required: true },
    {
      id: 'gptRequest',
      label: 'GPT Запрос',
      visible: columnVisibility.gptRequest ?? false,
      required: false,
    },
    {
      id: 'gptResponse',
      label: 'GPT Ответ',
      visible: columnVisibility.gptResponse ?? false,
      required: false,
    },
    {
      id: 'createdAt',
      label: 'Создано',
      visible: columnVisibility.createdAt ?? false,
      required: false,
    },
    {
      id: 'updatedAt',
      label: 'Обновлено',
      visible: columnVisibility.updatedAt ?? false,
      required: false,
    },
    { id: 'actions', label: 'Действия', visible: true, required: true },
  ];
}
