import type { VisibilityState } from '@tanstack/react-table';

import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

export function createMetaColumns(columnVisibility: VisibilityState): ColumnConfig[] {
  return [
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
