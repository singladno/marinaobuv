'use client';

import { useState } from 'react';
import { Check, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export type FeedbackType = 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT';

interface FeedbackOption {
  type: FeedbackType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OrderItemFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedback: (feedbackType: FeedbackType) => Promise<void>;
  itemName: string;
  hasReplacementProposal?: boolean;
  loading?: boolean;
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: 'WRONG_SIZE',
    label: 'Неправильные размеры',
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
];

export function OrderItemFeedbackModal({
  isOpen,
  onClose,
  onFeedback,
  itemName,
  hasReplacementProposal = false,
  loading = false,
}: OrderItemFeedbackModalProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFeedback = async (feedbackType: FeedbackType) => {
    setIsSubmitting(true);
    try {
      await onFeedback(feedbackType);
      setSelectedFeedback(null);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableOptions = hasReplacementProposal
    ? [
        ...feedbackOptions,
        {
          type: 'AGREE_REPLACEMENT' as FeedbackType,
          label: 'Согласен с заменой',
          description: 'Принимаю предложенную замену',
          icon: <Check className="h-5 w-5" />,
          color:
            'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
        },
      ]
    : feedbackOptions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Обратная связь по товару"
      size="md"
    >
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">{itemName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Выберите причину, по которой товар не подходит:
        </p>

        <div className="space-y-3">
          {availableOptions.map(option => (
            <button
              key={option.type}
              onClick={() => handleFeedback(option.type)}
              disabled={isSubmitting}
              className={cn(
                'w-full rounded-lg border-2 p-4 transition-all duration-200',
                'flex items-start space-x-3 text-left',
                'disabled:cursor-not-allowed disabled:opacity-50',
                option.color,
                selectedFeedback === option.type && 'ring-2 ring-blue-500'
              )}
            >
              <div className="flex flex-shrink-0 items-center justify-center">
                {option.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium">{option.label}</h4>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
              {isSubmitting && selectedFeedback === option.type && (
                <RefreshCw className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin" />
              )}
            </button>
          ))}
        </div>

        {hasReplacementProposal && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Предложена замена
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
              Администратор предложил альтернативный товар
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
