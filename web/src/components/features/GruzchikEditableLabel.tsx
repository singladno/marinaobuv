'use client';

import { useState } from 'react';

import type { GruzchikOrder } from '@/hooks/useGruzchikOrders';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface EditableLabelProps {
  order: GruzchikOrder;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}

export function EditableLabel({ order, onUpdate }: EditableLabelProps) {
  const { addNotification } = useNotifications();
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState(order.label || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );

  const handleBlur = async () => {
    const trimmedValue = value.trim() || null;
    if (trimmedValue !== order.label) {
      setIsUpdating(true);
      setStatus('saving');

      try {
        await onUpdate(order.id, { label: trimmedValue });
        setStatus('success');
        // Clear success status after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        setStatus('error');
        setValue(order.label || '');
        // Clear error status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center space-x-1 text-blue-600">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            <span className="text-xs">сохранение</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center space-x-1 text-green-600">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">сохранено</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">ошибка</span>
          </div>
        );
      default:
        return null;
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
        className={`w-full rounded border px-2 py-1 text-sm transition-colors focus:outline-none ${
          isUpdating
            ? 'border-violet-300 bg-violet-50 text-gray-500 dark:border-violet-600 dark:bg-violet-900/20 dark:text-gray-400'
            : 'border-gray-300 bg-transparent focus:border-blue-500 dark:border-gray-600 dark:text-white'
        }`}
        placeholder="Добавить метку"
        disabled={isUpdating}
      />
      {status !== 'idle' && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {getStatusIndicator()}
        </div>
      )}
    </div>
  );
}
