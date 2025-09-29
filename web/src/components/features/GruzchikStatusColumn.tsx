import { Badge } from '@/components/ui/Badge';

import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface GruzchikStatusColumnProps {
  orderId: string;
  status?: string | null;
  updatingOrders: Set<string>;
}

export function GruzchikStatusColumn({
  orderId,
  status,
  updatingOrders,
}: GruzchikStatusColumnProps) {
  const getVariant = ():
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline' => {
    if (status === 'Закуплен') return 'default';
    if (status === 'Наличие') return 'secondary';
    return 'outline';
  };

  const getDisplayText = () => {
    if (status === 'Закуплен') return 'Закуплен';
    if (status === 'Наличие') return 'В наличии';
    return status;
  };

  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <Badge variant={getVariant()}>{getDisplayText()}</Badge>
    </GruzchikRowWrapper>
  );
}
