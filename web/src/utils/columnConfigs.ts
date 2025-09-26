import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';
import type { VisibilityState } from '@tanstack/react-table';

export function createColumnConfigs(
  columnVisibility: VisibilityState,
  status?: string
): ColumnConfig[] {
  const isDraft = status === 'draft' || !status;
  const isApproved = status === 'approved';

  return [
    { id: 'select', label: 'Выбор', visible: true, required: true },
    {
      id: 'name',
      label: 'Название',
      visible: isApproved, // Only show in approved table
      required: isApproved,
    },
    {
      id: 'article',
      label: 'Артикул',
      visible: true, // Always visible
      required: true,
    },
    {
      id: 'category',
      label: 'Категория',
      visible: isApproved,
      required: isApproved,
    },
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
    {
      id: 'material',
      label: 'Материал',
      visible: isApproved, // Only show in approved table
      required: isApproved,
    },
    {
      id: 'gender',
      label: 'Пол',
      visible: isApproved, // Only show in approved table
      required: isApproved,
    },
    {
      id: 'season',
      label: 'Сезон',
      visible: isApproved, // Only show in approved table
      required: isApproved,
    },
    { id: 'sizes', label: 'Размеры', visible: true, required: true },
    { id: 'images', label: 'Изображения', visible: true, required: true },
    {
      id: 'aiStatus',
      label: 'AI Статус',
      visible: isApproved, // Only show in approved table
      required: false,
    },
    { id: 'source', label: 'Источник', visible: true, required: true },
    {
      id: 'sourceOptimistic',
      label: 'Источник (Оптимистичный)',
      visible: true,
      required: true,
    },
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
      id: 'gptRequest2',
      label: 'GPT Запрос 2',
      visible: columnVisibility.gptRequest2 ?? false,
      required: false,
    },
    {
      id: 'gptResponse2',
      label: 'GPT Ответ 2',
      visible: columnVisibility.gptResponse2 ?? false,
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
