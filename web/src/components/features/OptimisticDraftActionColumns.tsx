import type { Draft } from '@/types/admin';

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
      cell: ({ row }) => (
        <ProviderCell draft={row.original} onPatch={onPatch} />
      ),
    },
    {
      id: 'gptRequest',
      header: 'GPT Запрос',
      cell: ({ row }) => (
        <GptRequestCell draft={row.original} onPatch={onPatch} />
      ),
    },
    {
      id: 'gptResponse',
      header: 'GPT Ответ',
      cell: ({ row }) => (
        <GptResponseCell draft={row.original} onPatch={onPatch} />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
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
