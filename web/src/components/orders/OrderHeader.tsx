import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { formatOrderNumberForDisplay } from '@/utils/orderNumberUtils';
import {
  getClientStatusDisplay,
  getClientStatusColor,
} from '@/utils/clientStatusUtils';

interface OrderHeaderProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
  };
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Use client-friendly status display and colors
  const clientStatus = getClientStatusDisplay(order.status);
  const statusColor = getClientStatusColor(order.status);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link
          href={`/orders/${order.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
        >
          Заказ {formatOrderNumberForDisplay(order.orderNumber)}
        </Link>
        <Badge className={statusColor}>{clientStatus}</Badge>
      </div>
      <Text className="text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </Text>
    </div>
  );
}
