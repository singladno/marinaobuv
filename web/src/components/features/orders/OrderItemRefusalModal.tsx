'use client';

import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface RefusalReason {
  type: 'WRONG_SIZE' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'OTHER';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OrderItemRefusalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefusal: (
    reason: string,
    type: 'WRONG_SIZE' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'OTHER'
  ) => Promise<void>;
  itemName: string;
  loading?: boolean;
}

const refusalReasons: RefusalReason[] = [
  {
    type: 'WRONG_SIZE',
    label: 'Неправильный размер',
    description: 'Товар не подходит по размеру',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
  {
    type: 'WRONG_ITEM',
    label: 'Не тот товар',
    description: 'Получен не тот товар, который заказывал',
    icon: <Trash2 className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    type: 'QUALITY_ISSUE',
    label: 'Проблемы с качеством',
    description: 'Товар имеет дефекты или не соответствует ожиданиям',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    type: 'OTHER',
    label: 'Другая причина',
    description: 'Укажите причину в комментарии',
    icon: <X className="h-5 w-5" />,
    color: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100',
  },
];

export function OrderItemRefusalModal({
  isOpen,
  onClose,
  onRefusal,
  itemName,
  loading = false,
}: OrderItemRefusalModalProps) {
  const [selectedReason, setSelectedReason] = useState<
    RefusalReason['type'] | null
  >(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefusal = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const reasonText =
        selectedReason === 'OTHER'
          ? customReason.trim()
          : refusalReasons.find(r => r.type === selectedReason)?.label || '';

      if (!reasonText) {
        throw new Error('Необходимо указать причину отказа');
      }

      await onRefusal(reasonText, selectedReason);
      setSelectedReason(null);
      setCustomReason('');
      onClose();
    } catch (error) {
      console.error('Failed to submit refusal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    selectedReason && (selectedReason !== 'OTHER' || customReason.trim());

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Отказ от товара" size="md">
      <div className="space-y-4 p-6">
        <div className="text-sm text-gray-600">
          <strong>Товар:</strong> {itemName}
        </div>

        <p className="text-sm text-gray-600">
          Укажите причину отказа от товара:
        </p>

        <div className="space-y-3">
          {refusalReasons.map(reason => (
            <button
              key={reason.type}
              onClick={() => setSelectedReason(reason.type)}
              disabled={isSubmitting}
              className={cn(
                'w-full rounded-lg border-2 p-4 transition-all duration-200',
                'flex items-start space-x-3 text-left',
                'disabled:cursor-not-allowed disabled:opacity-50',
                reason.color,
                selectedReason === reason.type && 'ring-2 ring-blue-500'
              )}
            >
              <div className="flex flex-shrink-0 items-center justify-center">
                {reason.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium">{reason.label}</h4>
                <p className="mt-1 text-xs text-gray-600">
                  {reason.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {selectedReason === 'OTHER' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Укажите причину отказа:
            </label>
            <Textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Опишите причину отказа..."
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            onClick={handleRefusal}
            disabled={!canSubmit || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Отправка...' : 'Отказаться от товара'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
