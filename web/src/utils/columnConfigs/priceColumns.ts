import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

export function createPriceColumns(): ColumnConfig[] {
  return [
    {
      id: 'pricePairRub',
      label: 'Цена/пара (₽)',
      visible: true,
      required: true,
    },
    { id: 'currency', label: 'Валюта', visible: true, required: true },
    {
      id: 'packPairs',
      label: 'Пар в упаковке',
      visible: true,
      required: true,
    },
    {
      id: 'priceBoxRub',
      label: 'Цена коробки (₽)',
      visible: true,
      required: true,
    },
    {
      id: 'providerDiscountRub',
      label: 'Скидка поставщика (₽)',
      visible: true,
      required: true,
    },
  ];
}
