import { Button } from '@/components/ui/Button';

import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface GruzchikActionsColumnProps {
  orderId: string;
  updatingOrders: Set<string>;
}

export function GruzchikActionsColumn({
  orderId,
  updatingOrders,
}: GruzchikActionsColumnProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="flex flex-col space-y-2">
        <Button
          size="sm"
          variant="primary"
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
    </GruzchikRowWrapper>
  );
}
