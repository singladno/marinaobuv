import { ColumnDef } from '@tanstack/react-table';

import { GruzchikActionsColumn } from '@/components/features/GruzchikActionsColumn';
import { EditableLabel } from '@/components/features/GruzchikEditableLabel';
import { GruzchikImageColumn } from '@/components/features/GruzchikImageColumn';
import { GruzchikNameColumn } from '@/components/features/GruzchikNameColumn';
import { GruzchikPaymentColumn } from '@/components/features/GruzchikPaymentColumn';
import { GruzchikRowWrapper as GroupRowWrapper } from '@/components/features/GruzchikRowWrapper';
import { GruzchikStatusColumn } from '@/components/features/GruzchikStatusColumn';
import type { GruzchikOrder } from '@/types/gruzchik';

interface CreateGruzchikAvailabilityColumnsParams {
  onUpdate?: (
    orderId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
  updatingOrders: Set<string>;
}

export function createGruzchikAvailabilityColumns({
  onUpdate,
  updatingOrders,
}: CreateGruzchikAvailabilityColumnsParams): ColumnDef<GruzchikOrder>[] {
  return [
    {
      id: 'image',
      header: 'Фото',
      cell: ({ row }) => (
        <GruzchikImageColumn
          orderId={row.original.id}
          imageUrl={row.original.items[0]?.product?.images?.[0]?.url || ''}
          name={row.original.items[0]?.name || ''}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <GruzchikNameColumn
          orderId={row.original.id}
          name={row.original.items[0]?.name || ''}
          onUpdate={onUpdate}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'label',
      header: 'Метка',
      cell: ({ row }) => (
        <GroupRowWrapper
          itemId={row.original.items[0]?.id || ''}
          updatingItems={new Set()}
        >
          {onUpdate ? (
            <EditableLabel order={row.original} onUpdate={onUpdate} />
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.label || 'Без метки'}
            </div>
          )}
        </GroupRowWrapper>
      ),
    },
    {
      id: 'payment',
      header: 'Оплата',
      cell: ({ row }) => (
        <GruzchikPaymentColumn
          orderId={row.original.id}
          payment={row.original.payment}
          onUpdate={onUpdate}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <GruzchikStatusColumn
          orderId={row.original.id}
          status={row.original.status}
          updatingOrders={updatingOrders}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <GruzchikActionsColumn
          orderId={row.original.id}
          updatingOrders={updatingOrders}
        />
      ),
    },
  ];
}
