import { EditableLabel } from './GruzchikEditableLabel';
import { GruzchikRowWrapper } from './GruzchikRowWrapper';

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
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      {onUpdate ? (
        <EditableLabel
          order={{ id: orderId, label: name || '' } as any}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {name || 'Без названия'}
        </div>
      )}
    </GruzchikRowWrapper>
  );
}
