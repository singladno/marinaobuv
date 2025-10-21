'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  Send,
  Camera,
  FileText,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { OrderItemData } from './OrderItemCard';
import { MediaPreview, MediaItem } from './MediaPreview';
import { MediaViewerModal } from './MediaViewerModal';
import { useMediaDraft } from '@/hooks/useMediaDraft';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

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

interface OrderItemChatProps {
  item: OrderItemData;
  onClose: () => void;
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

export function OrderItemChat({ item, onClose }: OrderItemChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [uploadingMessages, setUploadingMessages] = useState<{
    [key: string]: { progress: number; fileName: string };
  }>({});
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

    // Cleanup: restore scroll when chat closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await fetch(
          `/api/gruzchik/order-items/${item.itemId}/messages`
        );
        const data = await response.json();

        if (data.success) {
          const formattedMessages: ChatMessage[] = data.messages.map(
            (msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              senderName: msg.senderName,
              timestamp: new Date(msg.timestamp),
              isService: msg.isService,
              attachments: msg.attachments,
            })
          );
          setMessages(formattedMessages);
        } else {
          console.error('Failed to fetch messages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [item.itemId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!hasContent) return;

    setIsLoading(true);

    try {
      // If we have media items, upload them first
      if (draft.mediaItems.length > 0) {
        await handleMediaUpload();
      } else {
        // Send text-only message
        const response = await fetch(
          `/api/gruzchik/order-items/${item.itemId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: draft.text.trim(),
              isService: draft.isService,
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

          setMessages(prev => [...prev, newMessage]);
        } else {
          console.error('Failed to send message:', data.error);
        }
      }

      // Clear the draft after successful send
      clearDraft();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaUpload = async () => {
    if (draft.mediaItems.length === 0) return;

    try {
      // Group all media items into a single message
      const formData = new FormData();

      // Add all media files
      draft.mediaItems.forEach((mediaItem, index) => {
        formData.append(`files`, mediaItem.file);
        updateMediaProgress(mediaItem.id, 0);
      });

      // Add text and service flag
      formData.append('text', draft.text.trim() || '');
      formData.append('isService', draft.isService.toString());

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          // Update progress for all media items
          draft.mediaItems.forEach(mediaItem => {
            updateMediaProgress(mediaItem.id, progress);
          });
        }
      });

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(
              new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: new Headers({ 'Content-Type': 'application/json' }),
              })
            );
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open(
          'POST',
          `/api/gruzchik/order-items/${item.itemId}/messages/upload`
        );
        xhr.send(formData);
      });

      const data = await response.json();

      if (data.success) {
        const uploadedMessage: ChatMessage = {
          id: data.message.id,
          text: data.message.text,
          sender: data.message.sender,
          senderName: data.message.senderName,
          timestamp: new Date(data.message.timestamp),
          isService: data.message.isService,
          attachments: data.message.attachments,
        };

        setMessages(prev => [...prev, uploadedMessage]);
      } else {
        console.error('Failed to upload media:', data.error);
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Add files to draft instead of uploading immediately
    addMediaItems(files);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/gruzchik/order-items/${item.itemId}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setDeleteConfirmMessage(null);
      } else {
        console.error('Failed to delete message:', data.error);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenMediaViewer = (
    attachments: ChatMessage['attachments'],
    initialIndex: number = 0
  ) => {
    if (!attachments || attachments.length === 0) return;

    const mediaItems = attachments.map(attachment => ({
      type: attachment.type,
      name: attachment.name,
      size: attachment.size,
      data: attachment.data,
      url: attachment.url,
    }));

    setMediaViewerItems(mediaItems);
    setMediaViewerIndex(initialIndex);
    setMediaViewerOpen(true);
  };

  const getSenderName = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'gruzchik':
        return 'Грузчик';
      case 'client':
        return item.orderLabel
          ? `${item.orderLabel} ${item.customerPhone}`
          : item.customerPhone;
      case 'admin':
        return 'Админ';
      default:
        return 'Неизвестно';
    }
  };

  const getSenderColor = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'gruzchik':
        return 'bg-blue-500 text-white';
      case 'client':
        return 'bg-gray-500 text-white';
      case 'admin':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b bg-white p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <ArrowLeft className="h-10 w-10" />
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900">Комментарии</h2>
            <p className="text-sm text-gray-500">
              {item.itemName} • #{item.itemCode}
            </p>
          </div>
        </div>

        {/* Admin Service Message Toggle - moved to header */}
        {user?.role === 'ADMIN' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="service-message-header"
              checked={draft.isService}
              onCheckedChange={updateIsService}
            />
            <label
              htmlFor="service-message-header"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700"
            >
              {draft.isService && (
                <>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                  <span className="font-semibold text-orange-600">
                    Служебное сообщение
                  </span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-hidden p-4">
        {isLoadingMessages ? (
          <ChatLoader />
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.sender === 'gruzchik'
                    ? 'justify-end'
                    : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3',
                    message.sender === 'gruzchik'
                      ? message.isService
                        ? 'border-2 border-orange-400 bg-gradient-to-r from-orange-300 to-amber-300 text-black shadow-md'
                        : 'bg-green-200 text-black'
                      : message.isService
                        ? 'border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-black shadow-sm'
                        : 'bg-white text-black'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center space-x-2">
                      <span className="truncate text-xs font-medium opacity-75">
                        {message.senderName || getSenderName(message.sender)}
                      </span>
                      {message.isService && (
                        <div className="flex flex-shrink-0 items-center space-x-1">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                          <span className="text-xs font-semibold text-orange-600">
                            Служебный
                          </span>
                        </div>
                      )}
                    </div>
                    {message.sender === 'gruzchik' && (
                      <div className="ml-2 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmMessage(message.id)}
                          className="h-10 w-10 rounded p-0 hover:bg-transparent"
                          title="Удалить сообщение"
                        >
                          <Trash2 className="h-6 w-6 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {message.text && <p className="text-sm">{message.text}</p>}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="overflow-hidden rounded-lg">
                          {attachment.type.startsWith('image/') ? (
                            <button
                              onClick={() =>
                                handleOpenMediaViewer(
                                  message.attachments,
                                  index
                                )
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
                                handleOpenMediaViewer(
                                  message.attachments,
                                  index
                                )
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
                                handleOpenMediaViewer(
                                  message.attachments,
                                  index
                                )
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
              </div>
            ))}

            {/* Uploading Messages */}
            {Object.entries(uploadingMessages).map(([fileId, uploadData]) => (
              <div key={fileId} className="flex justify-end">
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3 text-black',
                    draft.isService ? 'bg-orange-200' : 'bg-green-200'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center space-x-2">
                      <span className="truncate text-xs font-medium opacity-75">
                        {user?.name || user?.phone || 'Грузчик'}
                      </span>
                    </div>
                    {draft.isService && (
                      <div className="ml-2 flex flex-shrink-0 items-center space-x-1">
                        <div className="h-1 w-1 rounded-full bg-black/30"></div>
                        <span className="text-xs opacity-50">Служебный</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                      <span className="text-sm">
                        Загрузка {uploadData.fileName}...
                      </span>
                    </div>
                    <span className="text-xs opacity-75">
                      {uploadData.progress}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-white transition-all duration-300 ease-in-out"
                        style={{ width: `${uploadData.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t bg-gray-50 p-4">
        {/* Service Message Toggle - only show for non-admin users */}
        {user?.role !== 'ADMIN' && (
          <div className="mb-3 flex items-center space-x-2">
            <Switch
              id="service-message"
              checked={draft.isService}
              onCheckedChange={updateIsService}
            />
            <label
              htmlFor="service-message"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700"
            >
              {draft.isService ? (
                <>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                  <span className="font-semibold text-orange-600">
                    Служебное сообщение
                  </span>
                </>
              ) : (
                <span>Видно клиенту</span>
              )}
            </label>
          </div>
        )}

        {/* Media Preview */}
        <MediaPreview
          mediaItems={draft.mediaItems}
          onRemove={removeMediaItem}
          className="border-t border-gray-100"
        />

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
                  Math.max(32, e.target.scrollHeight) + 'px';
              }}
              placeholder="Введите сообщение..."
              className="max-h-32 min-h-[40px] w-full resize-none pr-12"
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
              onChange={handleFileUpload}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Удалить сообщение
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Вы уверены, что хотите удалить это сообщение? Это действие
                нельзя отменить.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmMessage(null)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleDeleteMessage(deleteConfirmMessage)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Удаление...</span>
                  </div>
                ) : (
                  'Удалить'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {mediaViewerOpen && (
        <MediaViewerModal
          mediaItems={mediaViewerItems}
          initialIndex={mediaViewerIndex}
          onClose={() => setMediaViewerOpen(false)}
        />
      )}
    </div>
  );
}
