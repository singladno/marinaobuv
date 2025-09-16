import * as React from 'react';

import { Modal } from '@/components/ui/Modal';

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

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceMessage[] | null | undefined;
}

export function SourceModal({ isOpen, onClose, source }: SourceModalProps) {
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Неизвестно';
    const date = new Date(timestamp * 1000);
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString('ru-RU')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {date.toLocaleTimeString('ru-RU')}
        </div>
      </div>
    );
  };

  const formatCreatedAt = (createdAt: string) => {
    const date = new Date(createdAt);
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString('ru-RU')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {date.toLocaleTimeString('ru-RU')}
        </div>
      </div>
    );
  };

  if (!source || source.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Источник сообщений"
      size="xl"
    >
      <div className="space-y-4 p-6">
        {source.map((message, index) => (
          <div
            key={message.id}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
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
              <div className="mb-2 whitespace-pre-wrap text-sm">
                {message.text}
              </div>
            )}

            {message.type === 'image' && message.mediaUrl && (
              <div className="mt-2">
                <img
                  src={message.mediaUrl}
                  alt="Изображение из сообщения"
                  className="max-h-48 max-w-full rounded border object-contain"
                  loading="lazy"
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

            {message.type && message.type !== 'image' && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Тип: {message.type}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              ID: {message.id}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
