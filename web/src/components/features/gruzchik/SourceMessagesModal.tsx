'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageSquare,
  Image as ImageIcon,
  Video,
  FileText,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';

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
  provider?: {
    name: string;
  } | null;
}

interface SourceMessagesModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function SourceMessagesModal({
  productId,
  productName,
  onClose,
}: SourceMessagesModalProps) {
  const [messages, setMessages] = useState<SourceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourceMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/products/${productId}/source-messages`
        );
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages || []);
        } else {
          setError(data.error || 'Failed to fetch source messages');
        }
      } catch (err) {
        setError('Failed to fetch source messages');
        console.error('Error fetching source messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSourceMessages();
  }, [productId]);

  const formatTime = (timestamp: number | null, createdAt: string) => {
    if (timestamp) {
      return new Date(timestamp * 1000).toLocaleString('ru-RU');
    }
    return new Date(createdAt).toLocaleString('ru-RU');
  };

  const getMessageTypeIcon = (type: string | null) => {
    switch (type) {
      case 'imageMessage':
        return <ImageIcon className="h-4 w-4" />;
      case 'videoMessage':
        return <Video className="h-4 w-4" />;
      case 'documentMessage':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageTypeLabel = (type: string | null) => {
    switch (type) {
      case 'imageMessage':
        return 'Фото';
      case 'videoMessage':
        return 'Видео';
      case 'documentMessage':
        return 'Документ';
      case 'textMessage':
        return 'Текст';
      default:
        return 'Сообщение';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-gray-900">
                Источник сообщений
              </h2>
              <p className="text-sm text-gray-500">{productName}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-500">Загрузка сообщений...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-gray-900">
                Источник сообщений
              </h2>
              <p className="text-sm text-gray-500">{productName}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Ошибка загрузки
            </h3>
            <p className="mb-4 text-gray-500">{error}</p>
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900">Источник сообщений</h2>
            <p className="text-sm text-gray-500">{productName}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {messages.length} сообщений
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Нет сообщений
            </h3>
            <p className="text-gray-500">
              Источник сообщений для этого товара не найден
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className="space-y-3 rounded-lg bg-gray-50 p-4"
              >
                {/* Message Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {message.fromName || message.from || 'Неизвестно'}
                    </span>
                    {message.provider && (
                      <Badge variant="secondary" className="text-xs">
                        {message.provider.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(message.timestamp, message.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message Type */}
                <div className="flex items-center space-x-2">
                  {getMessageTypeIcon(message.type)}
                  <span className="text-sm text-gray-600">
                    {getMessageTypeLabel(message.type)}
                  </span>
                </div>

                {/* Message Content */}
                {message.text && (
                  <div className="rounded bg-white p-3">
                    <p className="whitespace-pre-wrap text-gray-900">
                      {message.text}
                    </p>
                  </div>
                )}

                {/* Media */}
                {message.mediaUrl && (
                  <div className="space-y-2">
                    {message.mediaMimeType?.startsWith('image/') ? (
                      <div className="relative">
                        <Image
                          src={message.mediaUrl}
                          alt="Message media"
                          width={400}
                          height={300}
                          className="w-full max-w-sm rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 bg-black/20 p-1 text-white hover:bg-black/30"
                          onClick={() =>
                            window.open(message.mediaUrl!, '_blank')
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : message.mediaMimeType?.startsWith('video/') ? (
                      <div className="relative">
                        <video
                          src={message.mediaUrl}
                          controls
                          className="w-full max-w-sm rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 bg-black/20 p-1 text-white hover:bg-black/30"
                          onClick={() =>
                            window.open(message.mediaUrl!, '_blank')
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 rounded bg-white p-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Файл: {message.mediaMimeType}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(message.mediaUrl!, '_blank')
                          }
                          className="ml-auto"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Открыть
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Message ID for debugging */}
                <div className="font-mono text-xs text-gray-400">
                  ID: {message.waMessageId}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
