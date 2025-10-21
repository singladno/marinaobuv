'use client';

import { CheckCircle, Clock, MessageSquare, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { OrderApprovalButton } from './OrderApprovalButton';
import { useOrderData } from '@/hooks/useOrderData';

interface OrderItem {
  id: string;
  isAvailable?: boolean | null;
}

interface OrderStatusMessageProps {
  status: string;
  orderNumber: string;
  orderId?: string;
  items?: OrderItem[];
  approvedItems?: Set<string>;
  onApprovalComplete?: () => void;
}

export function OrderStatusMessage({
  status,
  orderNumber,
  orderId,
  items = [],
  approvedItems = new Set(),
  onApprovalComplete,
}: OrderStatusMessageProps) {
  const { data, hasMessages, needsApproval } = useOrderData(orderId || null);

  // Calculate the correct counts including items with negative availability
  const getApprovalCounts = () => {
    const requiredItems = items.filter(item =>
      needsApproval(item.id, item.isAvailable)
    );

    const unapprovedItems = requiredItems.filter(
      item => !approvedItems.has(item.id)
    );

    return {
      totalRequired: requiredItems.length,
      unapprovedCount: unapprovedItems.length,
      approvedCount: requiredItems.length - unapprovedItems.length,
    };
  };

  const { totalRequired, unapprovedCount, approvedCount } = getApprovalCounts();

  if (status === 'Новый') {
    return (
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start space-x-3">
          <Clock className="mt-0.5 h-6 w-6 text-blue-600" />
          <div>
            <Text variant="h3" className="mb-2 text-blue-900">
              Заказ #{orderNumber} создан
            </Text>
            <Text className="text-blue-700">
              Ваш заказ успешно создан и будет взят в работу в ближайшее время.
              Мы уведомим вас, когда начнем обработку.
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'Согласование') {
    // Check if all items are auto-approved (no items require approval)
    if (totalRequired === 0) {
      return (
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="mt-0.5 h-6 w-6 text-green-600" />
            <div className="flex-1">
              <Text variant="h3" className="mb-2 text-green-900">
                Все товары автоматически одобрены
              </Text>
              <Text className="mb-4 text-green-700">
                У всех товаров в заказе нет сообщений от администратора. Заказ
                готов к следующему этапу.
              </Text>
              {orderId && (
                <OrderApprovalButton
                  orderId={orderId}
                  items={items}
                  approvedItems={approvedItems}
                  onApprovalComplete={onApprovalComplete}
                />
              )}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-start space-x-3">
          <MessageSquare className="mt-0.5 h-6 w-6 text-yellow-600" />
          <div className="flex-1">
            <Text variant="h3" className="mb-2 text-yellow-900">
              Требуется согласование
            </Text>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <CheckCircle className="h-4 w-4" />
                <span>Проверьте сообщения для товаров с уведомлениями</span>
              </div>
              {orderId && (
                <OrderApprovalButton
                  orderId={orderId}
                  items={items}
                  approvedItems={approvedItems}
                  onApprovalComplete={onApprovalComplete}
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'Наличие' || status === 'Проверено') {
    return (
      <Card className="border-cyan-200 bg-cyan-50 p-6">
        <div className="flex items-start space-x-3">
          <ShoppingBag className="mt-0.5 h-6 w-6 text-cyan-600" />
          <div>
            <Text variant="h3" className="mb-2 text-cyan-900">
              Заказ в обработке
            </Text>
            <Text className="text-cyan-700">
              Ваш заказ находится в процессе обработки. Мы проверяем наличие
              товаров и подготавливаем их к отправке.
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
