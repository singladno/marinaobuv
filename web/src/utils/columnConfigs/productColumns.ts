import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

export function createProductColumns(isApproved: boolean): ColumnConfig[] {
  return [
    {
      id: 'material',
      label: 'Материал',
      visible: isApproved,
      required: isApproved,
    },
    {
      id: 'gender',
      label: 'Пол',
      visible: isApproved,
      required: isApproved,
    },
    {
      id: 'season',
      label: 'Сезон',
      visible: isApproved,
      required: isApproved,
    },
    { id: 'sizes', label: 'Размеры', visible: true, required: true },
    { id: 'images', label: 'Изображения', visible: true, required: true },
    {
      id: 'aiStatus',
      label: 'AI Статус',
      visible: isApproved,
      required: false,
    },
  ];
}
