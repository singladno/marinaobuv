import * as React from 'react';

import type { Draft } from '@/types/admin';
import {
  calculateTotalPairs,
  calculateBoxPrice,
} from '@/utils/sizeCalculations';

import { OptimisticEditableCell } from './OptimisticEditableCell';
import { PriceCell } from './PriceCell';

const MemoizedOptimisticEditableCell = React.memo(OptimisticEditableCell);

export function createPriceColumns(
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>
) {
  return [
    {
      id: 'pricePair',
      header: 'Цена за пару',
      cell: ({ row }) => (
        <MemoizedOptimisticEditableCell
          draft={row.original}
          field="pricePair"
          onPatch={onPatch}
        />
      ),
    },
    {
      id: 'totalPairs',
      header: 'Всего пар',
      cell: ({ row }) => {
        const totalPairs = calculateTotalPairs(row.original.sizes);
        return <div className="text-sm">{totalPairs}</div>;
      },
    },
    {
      id: 'boxPrice',
      header: 'Цена коробки',
      cell: ({ row }) => {
        const boxPrice = calculateBoxPrice(
          row.original.pricePair,
          row.original.sizes
        );
        return (
          <div className="text-sm font-medium">
            {boxPrice ? `${boxPrice} ₽` : 'Не рассчитано'}
          </div>
        );
      },
    },
    {
      id: 'price',
      header: 'Цена',
      cell: ({ row }) => <PriceCell draft={row.original} onPatch={onPatch} />,
    },
  ];
}
