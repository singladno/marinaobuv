'use client';

import { useState } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';

interface EditablePaymentProps {
  order: GruzchikOrder;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}

export function EditablePayment({ order, onUpdate }: EditablePaymentProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState<string>(String(order.payment ?? ''));
  const { addNotification } = useNotifications();

  const handleBlur = async () => {
    const trimmedValue = value.trim();
    const nextValue = trimmedValue === '' ? null : Number(trimmedValue);
    if (nextValue !== order.payment) {
      setIsUpdating(true);
      try {
        await onUpdate(order.id, { payment: nextValue });
        addNotification({
          type: 'success',
          title: 'Оплата обновлена',
          message: 'Информация об оплате успешно обновлена',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message: 'Не удалось обновить информацию об оплате',
        });
        setValue(String(order.payment ?? ''));
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className="w-full rounded border border-gray-300 bg-transparent px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
        placeholder="Сумма оплаты"
        disabled={isUpdating}
      />
    </div>
  );
}
