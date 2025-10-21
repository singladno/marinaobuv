import type { Draft } from '@/types/admin';

import {
  columnHelper,
  MemoizedEditableCell,
  MemoizedGenderSelectCell,
  MemoizedSeasonSelectCell,
} from './DraftTableColumnHelpers';

interface CreateProductColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
}

export function createProductColumns({ onPatch }: CreateProductColumnsParams) {
  const columns = [
    columnHelper.display({
      id: 'material',
      header: () => 'Материал',
      cell: info => (
        <MemoizedEditableCell
          value={info.row.original.material}
          onBlur={value => onPatch(info.row.original.id, { material: value })}
          placeholder="Введите материал"
          aria-label="Материал"
        />
      ),
    }),
  ];

  columns.push(
    columnHelper.display({
      id: 'description',
      header: () => 'Описание',
      cell: info => (
        <MemoizedEditableCell
          value={info.row.original.description}
          onBlur={value =>
            onPatch(info.row.original.id, { description: value })
          }
          placeholder="Введите описание"
          aria-label="Описание"
          disabled={(info as any).isProcessing}
        />
      ),
    })
  );

  columns.push(
    columnHelper.display({
      id: 'gender',
      header: () => 'Пол',
      size: 180,
      meta: {
        width: '180px',
      },
      cell: info => {
        return (
          <MemoizedGenderSelectCell
            value={info.row.original.gender}
            onChange={value => onPatch(info.row.original.id, { gender: value })}
          />
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'season',
      header: () => 'Сезон',
      size: 180,
      meta: {
        width: '180px',
      },
      cell: info => {
        return (
          <MemoizedSeasonSelectCell
            value={info.row.original.season}
            onChange={value => onPatch(info.row.original.id, { season: value })}
          />
        );
      },
    })
  );

  return columns;
}
