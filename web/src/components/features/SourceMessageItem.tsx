import Image from 'next/image';

import { formatCreatedAt, formatTimestamp } from '@/utils/dateFormatting';
import { isValidImageUrl } from '@/lib/image-security';

interface SourceMessage {
  id: string;
  waMessageId: string;
  from: string | null;
  fromName: string | null;
  type: string | null;
  text: string | null;
  timestamp: number | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  createdAt: string;
  provider: {
    name: string;
  } | null;
}

interface SourceMessageItemProps {
  message: SourceMessage;
}

export function SourceMessageItem({ message }: SourceMessageItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium">
          {message.fromName || message.from || 'Неизвестный отправитель'}
        </span>
        <span>
          {formatTimestamp(message.timestamp) ||
            formatCreatedAt(message.createdAt)}
        </span>
      </div>

      {message.provider && (
        <div className="mb-2 text-xs text-blue-600 dark:text-blue-400">
          Поставщик: {message.provider.name}
        </div>
      )}

      {message.text && (
        <div className="mb-2 whitespace-pre-wrap text-sm">{message.text}</div>
      )}

      {(message.type === 'image' ||
        message.type === 'imageMessage' ||
        message.type === 'photo') &&
        message.mediaUrl &&
        isValidImageUrl(message.mediaUrl) && (
          <div className="mt-2">
            <Image
              src={message.mediaUrl}
              alt="Изображение из сообщения"
              width={400}
              height={192}
              className="max-h-48 max-w-full rounded border object-contain"
              loading="lazy"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {message.mediaMimeType && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {message.mediaMimeType}
                {message.mediaWidth && message.mediaHeight && (
                  <span>
                    {' '}
                    ({message.mediaWidth}×{message.mediaHeight})
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      {message.type &&
        message.type !== 'image' &&
        message.type !== 'imageMessage' &&
        message.type !== 'photo' && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Тип: {message.type}
          </div>
        )}

      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        ID: {message.id}
      </div>
    </div>
  );
}
