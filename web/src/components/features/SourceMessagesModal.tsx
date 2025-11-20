'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/product';
import type { WhatsAppMessage } from '@/types/whatsapp';

interface SourceMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function SourceMessagesModal({
  isOpen,
  onClose,
  product,
}: SourceMessagesModalProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      isOpen &&
      product.sourceMessageIds &&
      Array.isArray(product.sourceMessageIds)
    ) {
      fetchSourceMessages();
    }
  }, [isOpen, product.sourceMessageIds]);

  const fetchSourceMessages = async () => {
    if (!product.sourceMessageIds || !Array.isArray(product.sourceMessageIds)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products/source-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds: product.sourceMessageIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch source messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching source messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageType = (type: string | null | undefined) => {
    const typeMap: Record<string, string> = {
      textMessage: 'Текст',
      imageMessage: 'Изображение',
      extendedTextMessage: 'Расширенный текст',
      documentMessage: 'Документ',
      videoMessage: 'Видео',
      audioMessage: 'Аудио',
    };
    return typeMap[type || ''] || type || 'Неизвестно';
  };

  // Check if this is a MANUAL product with a source screenshot
  const hasSourceScreenshot = product.source === 'MANUAL' && product.sourceScreenshotUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Исходное сообщение">
      <div className="max-h-96 overflow-y-auto">
        {hasSourceScreenshot ? (
          // Show source screenshot for MANUAL products
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-700">
                Скриншот исходного сообщения:
              </div>
              <div className="flex justify-center">
                {product.sourceScreenshotUrl && (
                  <Image
                    src={product.sourceScreenshotUrl}
                    alt="Source screenshot"
                    width={800}
                    height={600}
                    className="max-h-[600px] w-auto rounded border object-contain"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          // Show WhatsApp messages for WA/AG products
          <>
            {loading && (
              <div className="flex justify-center py-4">
                <div className="text-gray-500">Загрузка сообщений...</div>
              </div>
            )}

            {error && (
              <div className="py-4 text-center text-red-500">Ошибка: {error}</div>
            )}

            {!loading && !error && messages.length === 0 && (
              <div className="py-4 text-center text-gray-500">
                Сообщения не найдены
              </div>
            )}

            {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="rounded-lg border bg-gray-50 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="text-sm text-gray-600">
                    Сообщение {index + 1}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(message.createdAt)}
                  </div>
                </div>

                <div className="mb-2">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {formatMessageType(message.type)}
                  </span>
                </div>

                {message.text && (
                  <div className="mb-2">
                    <div className="mb-1 text-sm font-medium text-gray-700">
                      Текст:
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-900">
                      {message.text}
                    </div>
                  </div>
                )}

                {message.mediaUrl && (
                  <div className="mb-2">
                    <div className="mb-1 text-sm font-medium text-gray-700">
                      Медиа:
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image
                        src={message.mediaUrl}
                        alt="Media"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded border object-cover"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="text-xs text-gray-500">
                        {message.mediaMimeType && (
                          <div>Тип: {message.mediaMimeType}</div>
                        )}
                        {message.mediaFileSize && (
                          <div>
                            Размер: {(message.mediaFileSize / 1024).toFixed(1)}{' '}
                            KB
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {message.fromName && (
                  <div className="text-xs text-gray-500">
                    От: {message.fromName}
                  </div>
                )}
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex justify-end border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  );
}
