import { Card } from '@/components/ui/Card';

import { OrderCustomer } from './OrderCustomer';
import { OrderHeader } from './OrderHeader';
import { OrderItems } from './OrderItems';
import { OrderSummary } from './OrderSummary';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  fullName: string | null;
  phone: string;
  address: string | null;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <OrderHeader order={order} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Клиент</h4>
            <OrderCustomer order={order} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Товары</h4>
            <OrderItems items={order.items} />
          </div>
        </div>

        <OrderSummary order={order} />
      </div>
    </Card>
  );
}
