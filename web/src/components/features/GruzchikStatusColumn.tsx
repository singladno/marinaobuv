import { Badge } from '@/components/ui/Badge';

import { RowWrapper } from './GruzchikRowWrapper';

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
  const getVariant = () => {
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
    <RowWrapper orderId={orderId} updatingOrders={updatingOrders}>
      <Badge variant={getVariant()}>{getDisplayText()}</Badge>
    </RowWrapper>
  );
}
