import type { Draft } from '@/types/admin';

import { columnHelper, MemoizedSizesCell } from './DraftTableColumnHelpers';
import { ImagesCell } from './DraftTableCells';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { SourceCell } from './SourceCell';

interface CreateAdditionalColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onDelete: (id: string) => Promise<void>;
  status?: string;
}

export function createAdditionalColumns({
  onPatch,
  onImageToggle,
  onReload,
  onDelete,
  status,
}: CreateAdditionalColumnsParams) {
  const isApproved = status === 'approved';
  const columns = [];

  // Add sizes column
  columns.push(
    columnHelper.display({
      id: 'sizes',
      header: () => 'Размеры',
      cell: info => {
        return (
          <MemoizedSizesCell
            sizes={info.row.original.sizes}
            onChange={next => {
              onPatch(info.row.original.id, { sizes: next });
            }}
          />
        );
      },
    })
  );

  // Add AI status column for approved status
  if (isApproved) {
    columns.push(
      columnHelper.display({
        id: 'aiStatus',
        header: () => 'AI Статус',
        cell: info => {
          const aiStatus = info.row.original.aiStatus;
          const aiProcessedAt = info.row.original.aiProcessedAt;

          if (!aiStatus) {
            return <span className="text-gray-400 dark:text-gray-500">—</span>;
          }

          const getStatusColor = (status: string) => {
            switch (status) {
              case 'ai_processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
              case 'ai_completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
              case 'ai_failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
              default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            }
          };

          const getStatusLabel = (status: string) => {
            switch (status) {
              case 'ai_processing':
                return 'Обрабатывается';
              case 'ai_completed':
                return 'Завершено';
              case 'ai_failed':
                return 'Ошибка';
              default:
                return status;
            }
          };

          return (
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(aiStatus)}`}
              >
                {aiStatus === 'ai_processing' && (
                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {getStatusLabel(aiStatus)}
              </span>
              {aiProcessedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(aiProcessedAt).toLocaleTimeString('ru-RU')}
                </span>
              )}
            </div>
          );
        },
      })
    );
  }

  columns.push(
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
    })
  );

  columns.push(
    columnHelper.display({
      id: 'source',
      header: () => 'Источник',
      cell: info => <SourceCell source={info.row.original.source} />,
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptRequest',
      header: () => 'GPT Запрос',
      cell: info => (
        <GptRequestCell gptRequest={info.row.original.gptRequest} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptResponse',
      header: () => 'GPT Ответ',
      cell: info => (
        <GptResponseCell rawGptResponse={info.row.original.rawGptResponse} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptRequest2',
      header: () => 'GPT Запрос 2',
      cell: info => (
        <GptRequestCell gptRequest={info.row.original.gptRequest2} />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gptResponse2',
      header: () => 'GPT Ответ 2',
      cell: info => (
        <GptResponseCell rawGptResponse={info.row.original.rawGptResponse2} />
      ),
    })
  );

  columns.push(
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
    })
  );

  columns.push(
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
    })
  );

  columns.push(
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
    })
  );

  return columns;
}
