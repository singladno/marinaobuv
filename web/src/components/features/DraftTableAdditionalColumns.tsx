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
  onDelete?: (id: string) => Promise<void>;
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
          onChange={next => onPatch(row.original.id, { sizes: next })}
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
        <GptRequestCell gptRequest={row.original.gptRequest} />
      ),
    })
  );

  // Add GPT response column
  columns.push(
    columnHelper.display({
      id: 'gptResponse',
      header: 'GPT Ответ',
      cell: ({ row }) => (
        <GptResponseCell rawGptResponse={row.original.rawGptResponse} />
      ),
    })
  );

  // Add source column
  columns.push(
    columnHelper.display({
      id: 'source',
      header: 'Источник',
      cell: ({ row }) => <SourceCell source={row.original.source} />,
    })
  );

  return columns;
}
