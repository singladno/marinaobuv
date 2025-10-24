'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, Camera, FileText, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { MediaPreview, MediaItem } from '../features/gruzchik/MediaPreview';
import { MediaViewerModal } from '../features/gruzchik/MediaViewerModal';
import { ItemApproveButton } from './ItemApproveButton';
import { useMediaDraft } from '@/hooks/useMediaDraft';
import { useClientChat } from '@/contexts/ClientChatContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { AdminPortalSwitcherHeader } from '@/components/ui/AdminPortalSwitcherHeader';
import { cn } from '@/lib/utils';

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

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
}

interface ClientOrderItemChatProps {
  item: OrderItem;
  onClose: () => void;
  onMessagesRead?: () => void;
  orderStatus?: string;
}

// Beautiful Chat Loader Component
function ChatLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated chat bubbles */}
        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-green-400 [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-purple-400"></div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            Загружаем историю сообщений
          </p>
          <p className="text-xs text-gray-400">Пожалуйста, подождите...</p>
        </div>

        {/* Progress indicator */}
        <div className="w-32">
          <div className="h-1 w-full rounded-full bg-gray-200">
            <div className="h-1 animate-pulse rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-purple-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientOrderItemChat({
  item,
  onClose,
  onMessagesRead,
  orderStatus,
}: ClientOrderItemChatProps) {
  const { setClientChatOpen } = useClientChat();
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerItems, setMediaViewerItems] = useState<
    {
      type: string;
      name: string;
      size?: number;
      data?: string;
      url?: string;
    }[]
  >([]);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Prevent duplicate network calls in React Strict Mode/dev
  const fetchedForItemRef = useRef<string | null>(null);

  // Use the media draft hook
  const {
    draft,
    updateText,
    updateIsService,
    addMediaItems,
    removeMediaItem,
    updateMediaProgress,
    clearDraft,
    hasContent,
  } = useMediaDraft();

  // Prevent background scrolling when chat is open
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;

    // Lock body scroll when chat opens
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Set chat as open
    setClientChatOpen(true);

    // Add keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore scroll when chat closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      document.removeEventListener('keydown', handleKeyDown);
      // Set chat as closed
      setClientChatOpen(false);
    };
  }, [setClientChatOpen, onClose]);

  // Fetch messages from API and mark as read
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return; // Wait for user to be loaded
      // Guard: ensure we only fetch once per item open
      if (fetchedForItemRef.current === item.id) return;
      fetchedForItemRef.current = item.id;

      try {
        setIsLoadingMessages(true);

        // Choose the right endpoints based on user role
        const isAdmin = user.role === 'ADMIN';
        const baseUrl = isAdmin ? '/api/admin' : '/api';

        // Mark messages as read
        await fetch(`${baseUrl}/order-items/${item.id}/mark-read`, {
          method: 'POST',
        });

        // Notify parent that messages have been read
        onMessagesRead?.();

        // Fetch messages
        const response = await fetch(
          `${baseUrl}/order-items/${item.id}/messages`
        );
        const data = await response.json();

        if (data.success) {
          const transformedMessages: ChatMessage[] = data.messages
            .filter((msg: any) => !msg.isService) // Filter out service messages for client view
            .map((msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              senderName: msg.senderName,
              timestamp: new Date(msg.timestamp),
              isService: msg.isService,
              attachments: msg.attachments,
            }));
          setMessages(transformedMessages);
        } else {
          console.error('Failed to fetch messages:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
    return () => {
      // Reset guard if item changes
      if (fetchedForItemRef.current === item.id) {
        fetchedForItemRef.current = null;
      }
    };
  }, [item.id, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!hasContent || !user) return;

    setIsLoading(true);

    try {
      // Choose the right endpoint based on user role
      const isAdmin = user.role === 'ADMIN';
      const baseUrl = isAdmin ? '/api/admin' : '/api';

      // Send text-only message
      const response = await fetch(
        `${baseUrl}/order-items/${item.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: draft.text.trim(),
            isService: false, // Clients can't send service messages
            attachments: [],
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newMessage: ChatMessage = {
          id: data.message.id,
          text: data.message.text,
          sender: data.message.sender,
          senderName: data.message.senderName,
          timestamp: new Date(data.message.timestamp),
          isService: data.message.isService,
          attachments: data.message.attachments,
        };

        // Only add non-service messages to client view
        if (!newMessage.isService) {
          setMessages(prev => [...prev, newMessage]);
        }
      } else {
        console.error('Failed to send message:', data.error);
      }

      // Clear the draft after successful send
      clearDraft();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Convert File[] to FileList-like object
      const fileList = {
        ...fileArray,
        item: (index: number) => fileArray[index] || null,
        length: fileArray.length,
      } as FileList;
      addMediaItems(fileList);
    }
  };

  const openMediaViewer = (
    attachments?: {
      type: string;
      name: string;
      size?: number;
      data?: string;
      url?: string;
    }[],
    index?: number
  ) => {
    if (attachments) {
      setMediaViewerItems(attachments);
      setMediaViewerIndex(index || 0);
      setMediaViewerOpen(true);
    }
  };

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      style={{ bottom: '-1px' }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              title="Назад"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Чат по товару
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {orderStatus === 'Согласование' && (
              <ItemApproveButton itemId={item.id} size="sm" variant="success" />
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Закрыть чат"
            >
              <X className="h-5 w-5" />
            </Button>
            <AdminPortalSwitcherHeader />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-hidden px-4 py-4">
          {isLoadingMessages ? (
            <ChatLoader />
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender === 'client';
                const showDate =
                  index === 0 ||
                  formatDate(message.timestamp) !==
                    formatDate(messages[index - 1].timestamp);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    showDate={showDate}
                    onOpenMediaViewer={openMediaViewer}
                    canDelete={false}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {/* Media Preview */}
          {draft.mediaItems.length > 0 && (
            <div className="mb-3">
              <MediaPreview
                mediaItems={draft.mediaItems}
                onRemove={removeMediaItem}
              />
            </div>
          )}

          {/* Text Input */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Textarea
                value={draft.text}
                onChange={e => {
                  updateText(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height =
                    Math.max(40, e.target.scrollHeight) + 'px';
                }}
                placeholder="Введите сообщение..."
                className="max-h-32 min-h-[40px] w-full resize-none pr-12 text-base"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Выберите файлы для отправки"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title="Добавить фото или видео"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!hasContent || isLoading}
              className="flex h-10 w-10 items-center justify-center text-purple-500 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Отправить сообщение"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {mediaViewerOpen && (
        <MediaViewerModal
          onClose={() => setMediaViewerOpen(false)}
          mediaItems={mediaViewerItems}
          initialIndex={mediaViewerIndex}
        />
      )}
    </div>
  );
}
