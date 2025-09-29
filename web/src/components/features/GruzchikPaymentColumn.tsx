import { EditablePayment } from './GruzchikEditablePayment';
import { RowWrapper } from './GruzchikRowWrapper';

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
    <RowWrapper orderId={orderId} updatingOrders={updatingOrders}>
      {onUpdate ? (
        <EditablePayment
          order={{ id: orderId, payment: payment || 0 }}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {payment || 0} ₽
        </div>
      )}
    </RowWrapper>
  );
}
