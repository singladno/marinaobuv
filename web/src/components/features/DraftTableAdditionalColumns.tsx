import type { Draft } from '@/types/admin';

import { ImagesCell } from './DraftTableCells';
import { columnHelper, MemoizedSizesCell } from './DraftTableColumnHelpers';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { SourceCell } from './SourceCell';

interface CreateAdditionalColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  status?: string;
}

export function createAdditionalColumns({
  onPatch,
  onImageToggle,
  onReload,
  status,
}: CreateAdditionalColumnsParams) {
  const columns = [];

  // Add sizes column
  columns.push(
    columnHelper.display({
      id: 'sizes',
      header: 'Размеры',
      cell: ({ row }) => (
        <MemoizedSizesCell
          sizes={row.original.sizes}
          onPatch={onPatch}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Add images column
  columns.push(
    columnHelper.display({
      id: 'images',
      header: 'Фото',
      cell: ({ row }) => (
        <ImagesCell
          images={row.original.images}
          onImageToggle={onImageToggle}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Add GPT request column
  columns.push(
    columnHelper.display({
      id: 'gptRequest',
      header: 'GPT Запрос',
      cell: ({ row }) => (
        <GptRequestCell
          gptRequest={row.original.gptRequest}
          onPatch={onPatch}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Add GPT response column
  columns.push(
    columnHelper.display({
      id: 'gptResponse',
      header: 'GPT Ответ',
      cell: ({ row }) => (
        <GptResponseCell
          gptResponse={row.original.gptResponse}
          onPatch={onPatch}
          draftId={row.original.id}
        />
      ),
    })
  );

  // Add source column
  columns.push(
    columnHelper.display({
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => (
        <SourceCell
          source={row.original.source}
          onReload={onReload}
          draftId={row.original.id}
        />
      ),
    })
  );

  return columns;
}
