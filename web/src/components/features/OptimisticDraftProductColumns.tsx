import * as React from 'react';
import type { Row } from '@tanstack/react-table';

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
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedOptimisticEditableCell
          value={row.original.name}
          onSave={async value => {
            await onPatch(row.original.id, { name: (value as string) ?? null });
          }}
          placeholder="—"
          type="text"
        />
      ),
    },
    {
      id: 'article',
      header: 'Артикул',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedOptimisticEditableCell
          value={row.original.article}
          onSave={async value => {
            await onPatch(row.original.id, {
              article: (value as string) ?? null,
            });
          }}
          placeholder="—"
          type="text"
        />
      ),
    },
    {
      id: 'gender',
      header: 'Пол',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedGenderSelectCell
          value={row.original.gender}
          onChange={async value => {
            await onPatch(row.original.id, { gender: value });
          }}
        />
      ),
    },
    {
      id: 'season',
      header: 'Сезон',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedSeasonSelectCell
          value={row.original.season}
          onChange={async value => {
            await onPatch(row.original.id, { season: value });
          }}
        />
      ),
    },
    {
      id: 'sizes',
      header: 'Размеры',
      cell: ({ row }: { row: Row<Draft> }) => (
        <MemoizedOptimisticSizesCell
          sizes={(row.original.sizes || []).map(size => ({
            id: `${size.size}-${Math.random()}`,
            size: size.size,
            quantity: size.quantity || size.count || size.stock || 0,
            isActive: true,
          }))}
          onChange={async sizes => {
            await onPatch(row.original.id, {
              sizes: sizes.map(s => ({
                size: s.size,
                quantity: s.quantity,
                stock: s.quantity,
                count: s.quantity,
              })),
            });
          }}
        />
      ),
    },
  ];
}
