import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

export function createBasicColumns(isApproved: boolean): ColumnConfig[] {
  return [
    { id: 'select', label: 'Выбор', visible: true, required: true },
    {
      id: 'name',
      label: 'Название',
      visible: isApproved,
      required: isApproved,
    },
    {
      id: 'article',
      label: 'Артикул',
      visible: true,
      required: true,
    },
    {
      id: 'category',
      label: 'Категория',
      visible: isApproved,
      required: isApproved,
    },
    { id: 'provider', label: 'Поставщик', visible: true, required: true },
  ];
}
