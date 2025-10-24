'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { FileText } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'gruzchik' | 'client' | 'admin';
  senderName?: string;
  timestamp: Date;
  isService: boolean;
  attachments?: {
    type: string;
    name: string;
    size?: number;
    data?: string;
    url?: string;
  }[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showDate: boolean;
  onDelete?: (messageId: string) => void;
  onOpenMediaViewer?: (
    attachments?: ChatMessage['attachments'],
    initialIndex?: number
  ) => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export function MessageBubble({
  message,
  isCurrentUser,
  showDate,
  onDelete,
  onOpenMediaViewer,
  canDelete = false,
  isDeleting = false,
}: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSenderName = (
    sender: ChatMessage['sender'],
    senderName?: string
  ) => {
    if (senderName) return senderName;

    switch (sender) {
      case 'admin':
        return 'Админ';
      case 'gruzchik':
        return 'Грузчик';
      case 'client':
        return 'Клиент';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="space-y-2">
      {showDate && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            {formatDate(message.timestamp)}
          </Badge>
        </div>
      )}

      <div
        className={cn(
          'flex flex-col',
          isCurrentUser ? 'items-end' : 'items-start'
        )}
      >
        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
          {getSenderName(message.sender, message.senderName)}
        </div>
        <div
          className={cn(
            'group relative max-w-xs rounded-lg px-3 py-2',
            isCurrentUser
              ? message.isService
                ? 'border-2 border-orange-400 bg-gradient-to-r from-orange-300 to-amber-300 text-black shadow-md'
                : 'bg-blue-600 text-white'
              : message.isService
                ? 'border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-black shadow-sm'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
          )}
        >
          {message.isService && (
            <div className="mb-1 flex items-center space-x-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
              <span className="text-xs font-semibold text-orange-600">
                Служебный
              </span>
            </div>
          )}

          {message.text && <p className="text-sm">{message.text}</p>}

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="overflow-hidden rounded-lg">
                  {attachment.type.startsWith('image/') ? (
                    <button
                      onClick={() =>
                        onOpenMediaViewer?.(message.attachments, index)
                      }
                      className="block w-full transition-transform hover:scale-[1.02]"
                      aria-label={`View image: ${attachment.name}`}
                    >
                      <Image
                        src={attachment.data || attachment.url || ''}
                        alt={attachment.name}
                        width={400}
                        height={256}
                        className="h-auto max-h-64 max-w-full cursor-pointer rounded object-cover"
                      />
                    </button>
                  ) : attachment.type.startsWith('video/') ? (
                    <button
                      onClick={() =>
                        onOpenMediaViewer?.(message.attachments, index)
                      }
                      className="block w-full transition-transform hover:scale-[1.02]"
                      aria-label={`View video: ${attachment.name}`}
                    >
                      <video
                        src={attachment.data || attachment.url || ''}
                        controls
                        className="h-auto max-h-64 max-w-full cursor-pointer rounded"
                        onClick={e => e.stopPropagation()}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        onOpenMediaViewer?.(message.attachments, index)
                      }
                      className="flex w-full items-center space-x-2 rounded bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{attachment.name}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-1 text-xs opacity-75">
            {formatTime(message.timestamp)}
          </p>
        </div>

        {canDelete && isCurrentUser && onDelete && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => onDelete(message.id)}
              disabled={isDeleting}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
              title="Удалить сообщение"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
