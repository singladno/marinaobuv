import * as React from 'react';

import type { Draft } from '@/types/admin';

import { GenderSelectCell } from './GenderSelectCell';
import { OptimisticEditableCell } from './OptimisticEditableCell';
import { OptimisticSizesCell } from './OptimisticSizesCell';
import { SeasonSelectCell } from './SeasonSelectCell';

const MemoizedOptimisticEditableCell = React.memo(OptimisticEditableCell);
const MemoizedOptimisticSizesCell = React.memo(OptimisticSizesCell);
const MemoizedGenderSelectCell = React.memo(GenderSelectCell);
const MemoizedSeasonSelectCell = React.memo(SeasonSelectCell);

export function createProductColumns(
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>
) {
  return [
    {
      id: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <MemoizedOptimisticEditableCell
          draft={row.original}
          field="name"
          onPatch={onPatch}
        />
      ),
    },
    {
      id: 'article',
      header: 'Артикул',
      cell: ({ row }) => (
        <MemoizedOptimisticEditableCell
          draft={row.original}
          field="article"
          onPatch={onPatch}
        />
      ),
    },
    {
      id: 'gender',
      header: 'Пол',
      cell: ({ row }) => (
        <MemoizedGenderSelectCell draft={row.original} onPatch={onPatch} />
      ),
    },
    {
      id: 'season',
      header: 'Сезон',
      cell: ({ row }) => (
        <MemoizedSeasonSelectCell draft={row.original} onPatch={onPatch} />
      ),
    },
    {
      id: 'sizes',
      header: 'Размеры',
      cell: ({ row }) => (
        <MemoizedOptimisticSizesCell draft={row.original} onPatch={onPatch} />
      ),
    },
  ];
}
