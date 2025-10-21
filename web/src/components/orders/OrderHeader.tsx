import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { formatOrderNumberForDisplay } from '@/utils/orderNumberUtils';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новый':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Наличие':
        return 'bg-violet-100 text-violet-800';
      case 'Купить':
        return 'bg-amber-100 text-amber-800';
      case 'Согласование':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link
          href={`/orders/${order.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
        >
          Заказ {formatOrderNumberForDisplay(order.orderNumber)}
        </Link>
        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
      </div>
      <Text className="text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </Text>
    </div>
  );
}
