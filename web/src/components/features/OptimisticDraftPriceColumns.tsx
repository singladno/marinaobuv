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
          value={row.original.pricePair}
          type="price"
          onSave={async value => {
            const numeric = typeof value === 'string' ? Number(value) : value;
            await onPatch(row.original.id, { pricePair: numeric ?? null });
          }}
          placeholder="—"
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
      cell: ({ row }) => <PriceCell value={row.original.pricePair ?? null} />,
    },
  ];
}
