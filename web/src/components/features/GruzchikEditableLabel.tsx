'use client';

import { useState } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';

interface EditableLabelProps {
  order: GruzchikOrder;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}

export function EditableLabel({ order, onUpdate }: EditableLabelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState(order.label || '');
  const { addNotification } = useNotifications();

  const handleBlur = async () => {
    const trimmedValue = value.trim() || null;
    if (trimmedValue !== order.label) {
      setIsUpdating(true);
      try {
        await onUpdate(order.id, { label: trimmedValue });
        addNotification({
          type: 'success',
          title: 'Метка обновлена',
          message: 'Метка успешно обновлена',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message: 'Не удалось обновить метку',
        });
        setValue(order.label || '');
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
        placeholder="Добавить метку"
        disabled={isUpdating}
      />
    </div>
  );
}
