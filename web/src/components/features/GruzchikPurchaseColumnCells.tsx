import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';

import { EditableLabel } from './GruzchikEditableLabel';
import { EditablePayment } from './GruzchikEditablePayment';
import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface OrderNumberCellProps {
  orderNumber: string;
  orderId: string;
  updatingOrders: Set<string>;
}

export function OrderNumberCell({
  orderNumber,
  orderId,
  updatingOrders,
}: OrderNumberCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="font-medium text-gray-900 dark:text-white">
        {orderNumber}
      </div>
    </GruzchikRowWrapper>
  );
}

interface DateCellProps {
  createdAt: string;
  orderId: string;
  updatingOrders: Set<string>;
}

export function DateCell({
  createdAt,
  orderId,
  updatingOrders,
}: DateCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {format(new Date(createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
      </div>
    </GruzchikRowWrapper>
  );
}

interface CustomerCellProps {
  fullName?: string;
  phone: string;
  orderId: string;
  updatingOrders: Set<string>;
}

export function CustomerCell({
  fullName,
  phone,
  orderId,
  updatingOrders,
}: CustomerCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="space-y-1">
        <div className="font-medium text-gray-900 dark:text-white">
          {fullName || 'Не указано'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{phone}</div>
      </div>
    </GruzchikRowWrapper>
  );
}

interface ItemsCellProps {
  items?: Array<{
    imageUrl?: string;
    name: string;
    size?: string;
    color?: string;
  }>;
  orderId: string;
  updatingOrders: Set<string>;
}

export function ItemsCell({ items, orderId, updatingOrders }: ItemsCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="space-y-2">
        {items?.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Размер: {item.size} | Цвет: {item.color}
              </div>
            </div>
          </div>
        ))}
      </div>
    </GruzchikRowWrapper>
  );
}

interface LabelCellProps {
  order: GruzchikOrder;
  onUpdate?: (orderId: string, updates: any) => Promise<void>;
  orderId: string;
  updatingOrders: Set<string>;
}

export function LabelCell({
  order,
  onUpdate,
  orderId,
  updatingOrders,
}: LabelCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      {onUpdate ? (
        <EditableLabel order={order} onUpdate={onUpdate} />
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {order.label || 'Без метки'}
        </div>
      )}
    </GruzchikRowWrapper>
  );
}

interface PaymentCellProps {
  order: GruzchikOrder;
  onUpdate?: (orderId: string, updates: any) => Promise<void>;
  orderId: string;
  updatingOrders: Set<string>;
}

export function PaymentCell({
  order,
  onUpdate,
  orderId,
  updatingOrders,
}: PaymentCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      {onUpdate ? (
        <EditablePayment order={order} onUpdate={onUpdate} />
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {order.payment || 'Не указано'}
        </div>
      )}
    </GruzchikRowWrapper>
  );
}

interface StatusCellProps {
  status: string;
  orderId: string;
  updatingOrders: Set<string>;
}

export function StatusCell({
  status,
  orderId,
  updatingOrders,
}: StatusCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <Badge variant="outline">{status}</Badge>
    </GruzchikRowWrapper>
  );
}

interface ActionsCellProps {
  orderId: string;
  updatingOrders: Set<string>;
  onUpdate?: (orderId: string) => void;
  onView?: (orderId: string) => void;
}

export function ActionsCell({
  orderId,
  updatingOrders,
  onUpdate,
  onView,
}: ActionsCellProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="flex flex-col space-y-1">
        <Button
          size="sm"
          variant="primary"
          className="w-full text-xs"
          onClick={() => onUpdate?.(orderId)}
        >
          Обновить
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => onView?.(orderId)}
        >
          Подробнее
        </Button>
      </div>
    </GruzchikRowWrapper>
  );
}
