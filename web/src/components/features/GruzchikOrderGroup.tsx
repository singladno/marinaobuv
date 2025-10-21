import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrderGroup {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  items: Array<{
    orderId: string;
    orderNumber: string;
    orderDate: string;
    customerName: string | null;
    customerPhone: string;
    orderTotal: number;
  }>;
}

interface GruzchikOrderGroupProps {
  orderGroup: OrderGroup;
  children: React.ReactNode;
}

export function GruzchikOrderGroup({
  orderGroup,
  children,
}: GruzchikOrderGroupProps) {
  return (
    <div className="space-y-4">
      {/* Order Header */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Заказ #{orderGroup.orderNumber}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {format(new Date(orderGroup.orderDate), 'dd.MM.yyyy HH:mm', {
                  locale: ru,
                })}
              </span>
              <span>•</span>
              <span>{orderGroup.customerName}</span>
              <span>•</span>
              <span>{orderGroup.customerPhone}</span>
              <span>•</span>
              <span className="font-medium">
                {orderGroup.orderTotal.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {orderGroup.items.length} товар
              {orderGroup.items.length === 1
                ? ''
                : orderGroup.items.length < 5
                  ? 'а'
                  : 'ов'}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
}
