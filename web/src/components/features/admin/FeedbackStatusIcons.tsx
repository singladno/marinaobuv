'use client';

import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT';
export type ReplacementStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface FeedbackStatusIconsProps {
  feedbacks: Array<{
    type: FeedbackType;
    createdAt: string;
  }>;
  replacements: Array<{
    status: ReplacementStatus;
    createdAt: string;
  }>;
  hasMessages?: boolean;
  className?: string;
}

const feedbackIcons = {
  WRONG_SIZE: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Неправильные размеры',
  },
  WRONG_ITEM: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Не тот товар',
  },
  AGREE_REPLACEMENT: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Согласен с заменой',
  },
};

const replacementIcons = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Ожидает решения',
  },
  ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Замена принята',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Замена отклонена',
  },
};

export function FeedbackStatusIcons({
  feedbacks,
  replacements,
  hasMessages = false,
  className,
}: FeedbackStatusIconsProps) {
  const hasFeedback = feedbacks.length > 0;
  const hasReplacement = replacements.length > 0;
  const latestReplacement = replacements[replacements.length - 1];

  if (!hasFeedback && !hasReplacement && !hasMessages) {
    return null;
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {/* Messages indicator */}
      {hasMessages && (
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50"
          title="Есть сообщения в чате"
        >
          <MessageSquare className="h-3 w-3 text-blue-600" />
        </div>
      )}

      {/* Feedback icons */}
      {hasFeedback && (
        <div className="flex items-center space-x-1">
          {feedbacks.map((feedback, index) => {
            const config = feedbackIcons[feedback.type];
            const Icon = config.icon;

            return (
              <div
                key={`${feedback.type}-${index}`}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border',
                  config.bgColor,
                  config.borderColor
                )}
                title={config.label}
              >
                <Icon className={cn('h-3 w-3', config.color)} />
              </div>
            );
          })}
        </div>
      )}

      {/* Replacement status */}
      {hasReplacement && latestReplacement && (
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border',
            replacementIcons[latestReplacement.status].bgColor,
            replacementIcons[latestReplacement.status].borderColor
          )}
          title={replacementIcons[latestReplacement.status].label}
        >
          {latestReplacement.status === 'PENDING' ? (
            <Clock className="h-3 w-3 text-yellow-600" />
          ) : latestReplacement.status === 'ACCEPTED' ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <XCircle className="h-3 w-3 text-red-600" />
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for table cells
export function FeedbackStatusIconsCompact({
  feedbacks,
  replacements,
  hasMessages = false,
  className,
}: FeedbackStatusIconsProps) {
  const hasFeedback = feedbacks.length > 0;
  const hasReplacement = replacements.length > 0;
  const latestReplacement = replacements[replacements.length - 1];

  if (!hasFeedback && !hasReplacement && !hasMessages) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {/* Messages indicator */}
      {hasMessages && (
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50"
          title="Есть сообщения в чате"
        >
          <MessageSquare className="h-2.5 w-2.5 text-blue-600" />
        </div>
      )}

      {/* Feedback icons */}
      {hasFeedback && (
        <div className="flex items-center space-x-0.5">
          {feedbacks.slice(0, 2).map((feedback, index) => {
            const config = feedbackIcons[feedback.type];
            const Icon = config.icon;

            return (
              <div
                key={`${feedback.type}-${index}`}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border',
                  config.bgColor,
                  config.borderColor
                )}
                title={config.label}
              >
                <Icon className={cn('h-2.5 w-2.5', config.color)} />
              </div>
            );
          })}
          {feedbacks.length > 2 && (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-gray-50"
              title={`+${feedbacks.length - 2} еще`}
            >
              <span className="text-xs font-medium text-gray-600">
                +{feedbacks.length - 2}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Replacement status */}
      {hasReplacement && latestReplacement && (
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border',
            replacementIcons[latestReplacement.status].bgColor,
            replacementIcons[latestReplacement.status].borderColor
          )}
          title={replacementIcons[latestReplacement.status].label}
        >
          {latestReplacement.status === 'PENDING' ? (
            <Clock className="h-2.5 w-2.5 text-yellow-600" />
          ) : latestReplacement.status === 'ACCEPTED' ? (
            <CheckCircle className="h-2.5 w-2.5 text-green-600" />
          ) : (
            <XCircle className="h-2.5 w-2.5 text-red-600" />
          )}
        </div>
      )}
    </div>
  );
}
