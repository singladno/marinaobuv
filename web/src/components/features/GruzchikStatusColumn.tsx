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
  const getBadgeProps = () => {
    if (status === 'Закуплен') {
      return {
        variant: 'outline' as const,
        className:
          '!border-green-400 !bg-green-400 !text-white hover:!bg-green-500',
      };
    }
    if (status === 'Наличие') {
      return {
        variant: 'outline' as const,
        className:
          '!border-blue-400 !bg-blue-400 !text-white hover:!bg-blue-500',
      };
    }
    return {
      variant: 'outline' as const,
      className: 'border-gray-300 bg-gray-50 text-gray-600',
    };
  };

  const getDisplayText = () => {
    if (status === 'Закуплен') return 'Закуплен';
    if (status === 'Наличие') return 'В наличии';
    return status || 'Не указан';
  };

  const badgeProps = getBadgeProps();

  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <Badge variant={badgeProps.variant} className={badgeProps.className}>
        {getDisplayText()}
      </Badge>
    </GruzchikRowWrapper>
  );
}
