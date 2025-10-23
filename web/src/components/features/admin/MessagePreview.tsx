'use client';

import { MessageSquare, User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessagePreviewProps {
  messages: Array<{
    id: string;
    text: string | null;
    sender: 'admin' | 'gruzchik' | 'client';
    senderName?: string;
    isService: boolean;
    createdAt: string;
  }>;
  maxLength?: number;
  className?: string;
}

const senderIcons = {
  admin: Bot,
  gruzchik: User,
  client: User,
};

const senderColors = {
  admin: 'text-blue-600 bg-blue-50',
  gruzchik: 'text-green-600 bg-green-50',
  client: 'text-gray-600 bg-gray-50',
};

export function MessagePreview({
  messages,
  maxLength = 100,
  className,
}: MessagePreviewProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className={cn('flex items-center text-gray-400', className)}>
        <MessageSquare className="mr-1 h-4 w-4" />
        <span className="text-sm">Нет сообщений</span>
      </div>
    );
  }

  // Get the latest non-service message or the latest message if all are service
  const latestMessage =
    messages
      .slice()
      .reverse()
      .find(msg => !msg.isService) || messages[messages.length - 1];

  const truncatedText = latestMessage.text
    ? latestMessage.text.length > maxLength
      ? `${latestMessage.text.substring(0, maxLength)}...`
      : latestMessage.text
    : '';

  const SenderIcon = senderIcons[latestMessage.sender];
  const senderColor = senderColors[latestMessage.sender];

  const formatTime = (dateString: string) => {
    // Only calculate on client side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return 'Загрузка...';
    }

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Latest message preview */}
      <div className="flex items-start space-x-2">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            senderColor
          )}
        >
          <SenderIcon className="h-3 w-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {latestMessage.senderName ||
                (latestMessage.sender === 'admin'
                  ? 'Админ'
                  : latestMessage.sender === 'gruzchik'
                    ? 'Грузчик'
                    : 'Клиент')}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(latestMessage.createdAt)}
            </span>
            {latestMessage.isService && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium text-orange-600">
                  Служебное
                </span>
              </div>
            )}
          </div>
          {truncatedText && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
              {truncatedText}
            </p>
          )}
        </div>
      </div>

      {/* Message count indicator */}
      {messages.length > 1 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <MessageSquare className="h-3 w-3" />
          <span>
            {messages.length} сообщени
            {messages.length === 1 ? 'е' : messages.length < 5 ? 'я' : 'й'}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for table cells
export function MessagePreviewCompact({
  messages,
  maxLength = 50,
  className,
}: MessagePreviewProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className={cn('flex items-center text-gray-400', className)}>
        <MessageSquare className="mr-1 h-3 w-3" />
        <span className="text-xs">Нет сообщений</span>
      </div>
    );
  }

  const latestMessage =
    messages
      .slice()
      .reverse()
      .find(msg => !msg.isService) || messages[messages.length - 1];

  const truncatedText = latestMessage.text
    ? latestMessage.text.length > maxLength
      ? `${latestMessage.text.substring(0, maxLength)}...`
      : latestMessage.text
    : '';

  const SenderIcon = senderIcons[latestMessage.sender];
  const senderColor = senderColors[latestMessage.sender];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full',
          senderColor
        )}
      >
        <SenderIcon className="h-2.5 w-2.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {latestMessage.senderName ||
              (latestMessage.sender === 'admin'
                ? 'Админ'
                : latestMessage.sender === 'gruzchik'
                  ? 'Грузчик'
                  : 'Клиент')}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(latestMessage.createdAt)}
          </span>
          {latestMessage.isService && (
            <AlertCircle className="h-2.5 w-2.5 text-orange-500" />
          )}
        </div>
        {truncatedText && (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-700 dark:text-gray-300">
            {truncatedText}
          </p>
        )}
        {messages.length > 1 && (
          <span className="text-xs text-gray-500">
            +{messages.length - 1} еще
          </span>
        )}
      </div>
    </div>
  );
}
