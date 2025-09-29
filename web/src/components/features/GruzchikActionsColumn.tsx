import { Button } from '@/components/ui/Button';

import { RowWrapper } from './GruzchikRowWrapper';

interface GruzchikActionsColumnProps {
  orderId: string;
  updatingOrders: Set<string>;
}

export function GruzchikActionsColumn({
  orderId,
  updatingOrders,
}: GruzchikActionsColumnProps) {
  return (
    <RowWrapper orderId={orderId} updatingOrders={updatingOrders}>
      <div className="flex flex-col space-y-2">
        <Button
          size="sm"
          variant="default"
          className="w-full text-xs"
          onClick={() => console.log('Update availability for order:', orderId)}
        >
          Обновить наличие
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => console.log('View order:', orderId)}
        >
          Подробнее
        </Button>
      </div>
    </RowWrapper>
  );
}
