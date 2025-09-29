import { EditablePayment } from './GruzchikEditablePayment';
import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface GruzchikPaymentColumnProps {
  orderId: string;
  payment?: number | null;
  onUpdate?: (orderId: string, updates: any) => Promise<void>;
  updatingOrders: Set<string>;
}

export function GruzchikPaymentColumn({
  orderId,
  payment,
  onUpdate,
  updatingOrders,
}: GruzchikPaymentColumnProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      {onUpdate ? (
        <EditablePayment
          order={{ id: orderId, payment: payment || 0 } as any}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {payment || 0} ₽
        </div>
      )}
    </GruzchikRowWrapper>
  );
}
