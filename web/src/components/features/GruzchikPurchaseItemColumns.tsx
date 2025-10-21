import { ColumnDef } from '@tanstack/react-table';

import type { GruzchikOrderItemRow } from '@/hooks/useGruzchikOrders';

import {
  ActionsCell,
  ImageCell,
  NameCell,
  PriceCell,
  QuantityCell,
  StatusCell,
  TextCell,
} from './GruzchikColumnCells';

interface CreateGruzchikPurchaseItemColumnsParams {
  onUpdate?: (itemId: string, updates: any) => Promise<void>;
  updatingItems: Set<string>;
}

export function createGruzchikPurchaseItemColumns({
  onUpdate,
  updatingItems,
}: CreateGruzchikPurchaseItemColumnsParams): ColumnDef<GruzchikOrderItemRow>[] {
  return [
    {
      id: 'image',
      header: 'Фото',
      cell: ({ row }) => (
        <ImageCell
          imageUrl={row.original.itemImage || undefined}
          name={row.original.itemName}
          itemId={row.original.itemId}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <NameCell
          name={row.original.itemName}
          article={row.original.itemArticle || undefined}
          itemId={row.original.itemId}
          updatingItems={updatingItems}
        />
      ),
    },
    // Size and color are not available on GruzchikOrderItemRow
    // Keep placeholder columns if needed in the future
    {
      id: 'quantity',
      header: 'Количество',
      cell: ({ row }) => (
        <QuantityCell
          quantity={row.original.itemQty}
          itemId={row.original.itemId}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'price',
      header: 'Цена',
      cell: ({ row }) => (
        <PriceCell
          price={row.original.itemPrice}
          itemId={row.original.itemId}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <StatusCell
          status={row.original.orderStatus}
          itemId={row.original.itemId}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <ActionsCell
          itemId={row.original.itemId}
          updatingItems={updatingItems}
          onUpdate={() => console.log('Update item:', row.original.itemId)}
          onView={() => console.log('View item:', row.original.itemId)}
        />
      ),
    },
  ];
}
