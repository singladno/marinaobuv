'use client';
import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';

import { SourceMessageItem } from '../features/SourceMessageItem';

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

interface ProductSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function ProductSourceModal({
  isOpen,
  onClose,
  productId,
  productName,
}: ProductSourceModalProps) {
  const [messages, setMessages] = useState<SourceMessage[]>([]);
  const [sourceChatLabel, setSourceChatLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchSourceMessages();
    } else {
      setSourceChatLabel(null);
    }
  }, [isOpen, productId]);

  const fetchSourceMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      setSourceChatLabel(null);

      const response = await fetch(
        `/api/products/${productId}/source-messages`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(data.messages || []);
        setSourceChatLabel(data.sourceChatLabel ?? null);
      } else {
        setError(data.error || 'Failed to fetch source messages');
      }
    } catch (err) {
      setError('Network error while fetching source messages');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = `Источник: ${sourceChatLabel ?? productName}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      zIndex="z-[60]"
    >
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <Text className="font-medium">Ошибка загрузки</Text>
            <Text className="text-sm">{error}</Text>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="py-8 text-center">
            <Text className="text-gray-500 dark:text-gray-400">
              Источник сообщений не найден для этого товара
            </Text>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                Найдено {messages.length} сообщений из источника
              </Text>
            </div>

            <div className="space-y-4">
              {messages.map(message => (
                <SourceMessageItem key={message.id} message={message} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
