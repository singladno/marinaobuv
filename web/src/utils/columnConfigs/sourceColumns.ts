import type { VisibilityState } from '@tanstack/react-table';

import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

export function createSourceColumns(columnVisibility: VisibilityState): ColumnConfig[] {
  return [
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
  ];
}
