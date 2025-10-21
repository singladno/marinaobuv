'use client';

import { useState } from 'react';
import { X, Check, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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
    icon: <XCircle className="h-5 w-5" />,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h3 className="text-lg font-semibold">Обратная связь по товару</h3>
            <p className="truncate text-sm text-gray-600 dark:text-gray-400">
              {itemName}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
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
                <div className="mt-0.5 flex-shrink-0">{option.icon}</div>
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
        </CardContent>
      </Card>
    </div>
  );
}
