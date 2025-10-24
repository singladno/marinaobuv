'use client';

import { CheckCircle, Clock, MessageSquare, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { OrderApprovalButton } from './OrderApprovalButton';
import { useOrderData } from '@/hooks/useOrderData';
import { getClientStatusDisplay } from '@/utils/clientStatusUtils';

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
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm dark:border-green-800 dark:from-green-950 dark:to-emerald-950">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex-1">
            <Text
              variant="h3"
              className="mb-2 text-green-900 dark:text-green-100"
            >
              Заказ #{orderNumber} создан
            </Text>
            <Text className="leading-relaxed text-green-700 dark:text-green-300">
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
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-6 shadow-sm dark:border-orange-800 dark:from-orange-950 dark:to-yellow-950">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex-1">
            <Text
              variant="h3"
              className="mb-2 text-orange-900 dark:text-orange-100"
            >
              Требуется согласование
            </Text>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-orange-700 dark:text-orange-300">
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
    const clientStatus = getClientStatusDisplay(status);
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <Text
              variant="h3"
              className="mb-2 text-blue-900 dark:text-blue-100"
            >
              Заказ {clientStatus.toLowerCase()}
            </Text>
            <Text className="leading-relaxed text-blue-700 dark:text-blue-300">
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
