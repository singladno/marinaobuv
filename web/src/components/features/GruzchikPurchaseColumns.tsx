import { ColumnDef } from '@tanstack/react-table';

import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';

import {
  ActionsCell,
  CustomerCell,
  DateCell,
  ItemsCell,
  LabelCell,
  OrderNumberCell,
  PaymentCell,
  StatusCell,
} from './GruzchikPurchaseColumnCells';

interface CreateGruzchikPurchaseColumnsParams {
  onUpdate?: (orderId: string, updates: any) => Promise<void>;
  updatingOrders: Set<string>;
}

export function createGruzchikPurchaseColumns({
  onUpdate,
  updatingOrders,
}: CreateGruzchikPurchaseColumnsParams): ColumnDef<GruzchikOrder>[] {
  return [
    {
      id: 'orderNumber',
      header: '№ Заказа',
      cell: ({ row }) => (
        <OrderNumberCell
          orderNumber={row.original.orderNumber}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'date',
      header: 'Дата',
      cell: ({ row }) => (
        <DateCell
          createdAt={row.original.createdAt}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'customer',
      header: 'Клиент',
      cell: ({ row }) => (
        <CustomerCell
          fullName={row.original.fullName ?? undefined}
          phone={row.original.phone}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'items',
      header: 'Товары',
      cell: ({ row }) => (
        <ItemsCell
          items={row.original.items}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'label',
      header: 'Метка',
      cell: ({ row }) => (
        <LabelCell
          order={row.original}
          onUpdate={onUpdate}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'payment',
      header: 'Оплата',
      cell: ({ row }) => (
        <PaymentCell
          order={row.original}
          onUpdate={onUpdate}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <StatusCell
          status={row.original.status}
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <ActionsCell
          orderId={row.original.id}
          updatingOrders={updatingOrders}
          onUpdate={() =>
            console.log('Update purchase for order:', row.original.id)
          }
          onView={() => console.log('View order:', row.original.id)}
        />
      ),
    },
  ];
}
