import type { AdminOrder } from '@/hooks/useOrders';

interface OrderCustomerInfoProps {
  order: AdminOrder;
}

export function OrderCustomerInfo({ order }: OrderCustomerInfoProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
        <span className="text-xs font-medium text-gray-600">
          {order.customerName?.charAt(0) || '?'}
        </span>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">
          {order.customerName || 'Без имени'}
        </div>
        <div className="text-xs text-gray-500">{order.customerPhone}</div>
      </div>
    </div>
  );
}
