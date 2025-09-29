import type { Draft } from '@/types/admin';
import {
  calculateTotalPairs,
  calculateBoxPrice,
} from '@/utils/sizeCalculations';

import {
  columnHelper,
  MemoizedEditablePriceCell,
} from './DraftTableColumnHelpers';
import { PriceCell } from './PriceCell';

interface CreatePriceColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
}

export function createPriceColumns({ onPatch }: CreatePriceColumnsParams) {
  const columns = [
    columnHelper.display({
      id: 'pricePairRub',
      header: () => 'Цена/пара (₽)',
      cell: info => (
        <MemoizedEditablePriceCell
          value={info.row.original.pricePair}
          onBlur={value => onPatch(info.row.original.id, { pricePair: value })}
          placeholder="Введите цену"
          aria-label="Цена"
          disabled={(info as any).isProcessing}
        />
      ),
    }),
  ];

  columns.push(
    columnHelper.display({
      id: 'packPairs',
      header: () => 'Пар в упаковке',
      cell: info => {
        const { sizes } = info.row.original;
        const totalPairs = calculateTotalPairs(sizes || []);

        return (
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {totalPairs}
            </span>
          </div>
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'priceBoxRub',
      header: () => 'Цена коробки (₽)',
      cell: info => {
        const { pricePair, sizes } = info.row.original;
        const totalPairs = calculateTotalPairs(sizes || []);
        const calculatedBoxPrice = calculateBoxPrice(pricePair, totalPairs);

        return (
          <PriceCell
            value={calculatedBoxPrice}
            formatter={value => value.toLocaleString('ru-RU')}
          />
        );
      },
    })
  );

  columns.push(
    columnHelper.display({
      id: 'providerDiscountRub',
      header: () => 'Скидка поставщика (₽)',
      cell: info => (
        <MemoizedEditablePriceCell
          value={info.row.original.providerDiscount}
          onBlur={value =>
            onPatch(info.row.original.id, { providerDiscount: value })
          }
          placeholder="Введите скидку"
          aria-label="Скидка поставщика"
          disabled={(info as any).isProcessing}
        />
      ),
    })
  );

  return columns;
}
