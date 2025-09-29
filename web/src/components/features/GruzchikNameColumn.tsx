import { EditableLabel } from './GruzchikEditableLabel';
import { RowWrapper } from './GruzchikRowWrapper';

interface GruzchikNameColumnProps {
  orderId: string;
  name?: string | null;
  onUpdate?: (orderId: string, updates: any) => Promise<void>;
  updatingOrders: Set<string>;
}

export function GruzchikNameColumn({
  orderId,
  name,
  onUpdate,
  updatingOrders,
}: GruzchikNameColumnProps) {
  return (
    <RowWrapper orderId={orderId} updatingOrders={updatingOrders}>
      {onUpdate ? (
        <EditableLabel
          order={{ id: orderId, name: name || '' }}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {name || 'Без названия'}
        </div>
      )}
    </RowWrapper>
  );
}
