import type { Draft } from '@/types/admin';
import type { Row } from '@tanstack/react-table';

import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { ProviderCell } from './ProviderCell';

export function createActionColumns(
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>,
  onReload?: () => void
) {
  return [
    {
      id: 'provider',
      header: 'Поставщик',
      cell: ({ row }: { row: Row<Draft> }) => (
        <ProviderCell provider={row.original.provider} />
      ),
    },
    {
      id: 'gptRequest',
      header: 'GPT Запрос',
      cell: ({ row }: { row: Row<Draft> }) => (
        <GptRequestCell gptRequest={row.original.gptRequest} />
      ),
    },
    {
      id: 'gptResponse',
      header: 'GPT Ответ',
      cell: ({ row }: { row: Row<Draft> }) => (
        <GptResponseCell rawGptResponse={row.original.rawGptResponse} />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }: { row: Row<Draft> }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onDelete(row.original.id)}
            className="text-red-600 hover:text-red-800"
          >
            Удалить
          </button>
          {onReload && (
            <button
              onClick={onReload}
              className="text-blue-600 hover:text-blue-800"
            >
              Обновить
            </button>
          )}
        </div>
      ),
    },
  ];
}
