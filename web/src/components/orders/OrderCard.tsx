import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ClientOrderItemChat } from './ClientOrderItemChat';
import { OrderStatusMessage } from './OrderStatusMessage';
import { useItemApprovals } from '@/hooks/useItemApprovals';

import { OrderCustomer } from './OrderCustomer';
import { OrderHeader } from './OrderHeader';
import { OrderItems } from './OrderItems';
import { OrderSummary } from './OrderSummary';
import { TransportOptions } from './TransportOptions';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  color?: string | null;
  isAvailable?: boolean | null;
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
  replacements?: Array<{
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    replacementImageUrl: string | null;
    adminComment: string | null;
    createdAt: string;
  }>;
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
  transportOptions?: Array<{
    id: string;
    transportId: string;
    transportName: string;
    isSelected: boolean;
  }>;
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const { approvedItems, approveItem } = useItemApprovals();

  const handleChatClick = (item: OrderItem) => {
    setSelectedItem(item);
  };

  const handleCloseChat = () => {
    setSelectedItem(null);
  };

  const handleItemApproval = (itemId: string) => {
    approveItem(itemId);
  };

  // Show messages only for orders in "Согласование" status
  const showMessages = order.status === 'Согласование';
  const isApprovalStatus = order.status === 'Согласование';

  return (
    <>
      <div className="space-y-4">
        {/* Status-specific message */}
        <OrderStatusMessage
          status={order.status}
          orderNumber={order.orderNumber}
          orderId={order.id}
          items={order.items}
          approvedItems={approvedItems}
        />

        <Card className="p-6">
          <div className="space-y-4">
            <OrderHeader order={order} />

            <TransportOptions transportOptions={order.transportOptions} />

            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Товары</h4>
              <OrderItems
                items={order.items}
                onChatClick={handleChatClick}
                onItemApproval={handleItemApproval}
                showMessages={showMessages}
                showFeedback={isApprovalStatus}
                orderId={order.id}
                orderStatus={order.status}
              />
            </div>

            <OrderSummary order={order} />
          </div>
        </Card>
      </div>

      {selectedItem && (
        <ClientOrderItemChat
          item={selectedItem}
          onClose={handleCloseChat}
          orderStatus={order.status}
        />
      )}
    </>
  );
}
