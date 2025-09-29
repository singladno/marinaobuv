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
          imageUrl={row.original.imageUrl}
          name={row.original.name}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <NameCell
          name={row.original.name}
          article={row.original.article}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'size',
      header: 'Размер',
      cell: ({ row }) => (
        <TextCell
          value={row.original.size || 'Не указан'}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'color',
      header: 'Цвет',
      cell: ({ row }) => (
        <TextCell
          value={row.original.color || 'Не указан'}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'quantity',
      header: 'Количество',
      cell: ({ row }) => (
        <QuantityCell
          quantity={row.original.quantity}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'price',
      header: 'Цена',
      cell: ({ row }) => (
        <PriceCell
          price={row.original.price}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <StatusCell
          status={row.original.status}
          itemId={row.original.id}
          updatingItems={updatingItems}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <ActionsCell
          itemId={row.original.id}
          updatingItems={updatingItems}
          onUpdate={() => console.log('Update item:', row.original.id)}
          onView={() => console.log('View item:', row.original.id)}
        />
      ),
    },
  ];
}
