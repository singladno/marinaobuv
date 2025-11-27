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
import { MessageBubble } from '@/components/ui/MessageBubble';
import { OrderItemData } from '../gruzchik/OrderItemCard';
import { MediaPreview, MediaItem } from '../gruzchik/MediaPreview';
import { MediaViewerModal } from '../gruzchik/MediaViewerModal';
import { useMediaDraft } from '@/hooks/useMediaDraft';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/NextAuthUserContext';
import { useAdminChat } from '@/contexts/AdminChatContext';
import { AdminPortalSwitcherHeader } from '@/components/ui/AdminPortalSwitcherHeader';

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

interface AdminOrderItemChatProps {
  item: OrderItemData;
  onClose: () => void;
  onMessagesRead?: () => void;
}

// Beautiful Chat Loader Component
function ChatLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Загрузка чата...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Получаем сообщения
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminOrderItemChat({
  item,
  onClose,
  onMessagesRead,
}: AdminOrderItemChatProps) {
  const { user } = useUser();
  const { setAdminChatOpen } = useAdminChat();
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isAndroidChrome, setIsAndroidChrome] = useState(false);
  const [actualViewportHeight, setActualViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    const originalHeight = document.body.style.height;

    // Set admin chat as open
    setAdminChatOpen(true);

    // Lock body scroll when chat opens
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    // Cleanup: restore scroll when chat closes
    return () => {
      setAdminChatOpen(false);
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = originalHeight;
      document.body.style.top = '';
      document.body.style.left = '';
    };
  }, [setAdminChatOpen]);

  // Detect Android Chrome and calculate proper viewport
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
    const isAndroidChromeBrowser = isAndroid && isChrome;

    setIsAndroidChrome(isAndroidChromeBrowser);

    // Calculate actual viewport height for Android Chrome
    const calculateViewportHeight = () => {
      if (isAndroidChromeBrowser) {
        // For Android Chrome, use visualViewport.height which accounts for browser UI
        const visualHeight =
          window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.screen.height;

        // If visualViewport is significantly smaller than screen, browser UI is visible
        if (visualHeight < screenHeight * 0.9) {
          setActualViewportHeight(visualHeight);
        } else {
          // Browser UI is hidden, use full height minus safe area
          setActualViewportHeight(window.innerHeight);
        }
      } else {
        setActualViewportHeight(window.innerHeight);
      }
    };

    calculateViewportHeight();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', calculateViewportHeight);
    } else {
      window.addEventListener('resize', calculateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          'resize',
          calculateViewportHeight
        );
      } else {
        window.removeEventListener('resize', calculateViewportHeight);
      }
    };
  }, []);

  // Detect mobile keyboard open/close with actual height calculation
  useEffect(() => {
    let initialViewportHeight = window.innerHeight;

    const handleResize = () => {
      // Check if we're on mobile
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
        return;
      }

      // Get current viewport dimensions
      const currentViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;

      // Calculate keyboard height
      const calculatedKeyboardHeight = screenHeight - currentViewportHeight;

      // Keyboard is considered open if height difference is significant
      const keyboardThreshold = 150; // Minimum height to consider keyboard open
      const isOpen = calculatedKeyboardHeight > keyboardThreshold;

      setIsKeyboardOpen(isOpen);
      setKeyboardHeight(isOpen ? calculatedKeyboardHeight : 0);

      // Store initial height for future calculations
      if (!isOpen) {
        initialViewportHeight = currentViewportHeight;
      }
    };

    // Listen for viewport changes (more reliable than resize for mobile keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Auto-resize textarea when content changes
  // eslint-disable-next-line react/no-unknown-property
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(32, textarea.scrollHeight)}px`;
    }
  }, [draft.text]);

  // Fetch messages from API and mark as read
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (fetchedForItemRef.current === item.itemId) return;
        fetchedForItemRef.current = item.itemId;
        setIsLoadingMessages(true);

        // First, mark all messages as read
        await fetch(`/api/admin/order-items/${item.itemId}/mark-read`, {
          method: 'POST',
        });

        // Notify parent that messages have been read
        onMessagesRead?.();

        // Then fetch messages
        const response = await fetch(
          `/api/admin/order-items/${item.itemId}/messages`
        );
        const data = await response.json();

        if (data.success) {
          const transformedMessages: ChatMessage[] = data.messages.map(
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
      if (fetchedForItemRef.current === item.itemId) {
        fetchedForItemRef.current = null;
      }
    };
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
          `/api/admin/order-items/${item.itemId}/messages`,
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

    const formData = new FormData();
    formData.append('text', draft.text.trim());
    formData.append('isService', draft.isService.toString());

    // Add files to form data
    draft.mediaItems.forEach((mediaItem, index) => {
      if (mediaItem.file) {
        formData.append('files', mediaItem.file);
      }
    });

    try {
      const response = await fetch(
        `/api/admin/order-items/${item.itemId}/messages/upload`,
        {
          method: 'POST',
          body: formData,
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
        console.error('Failed to upload message:', data.error);
      }
    } catch (error) {
      console.error('Failed to upload message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/order-items/${item.itemId}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setDeleteConfirmMessage(null);
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (messageId: string) => {
    setDeleteConfirmMessage(messageId);
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

  return (
    <>
      {/* Full-screen overlay to prevent main page flash */}
      <div
        className="chat-overlay"
        // eslint-disable-next-line react/no-unknown-property
        style={{
          height: '100vh',
          width: '100vw',
        }}
      />

      {/* Chat container */}
      <div
        className="fixed inset-0 z-50 flex w-screen overflow-hidden bg-black bg-opacity-50"
        // eslint-disable-next-line react/no-unknown-property
        style={{
          height: isKeyboardOpen
            ? `${window.visualViewport?.height || window.innerHeight}px`
            : `${actualViewportHeight || window.innerHeight}px`,
          top: 0,
          left: 0,
          right: 0,
          bottom: isKeyboardOpen ? `${keyboardHeight}px` : 0,
        }}
      >
        <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0"
              >
                <ArrowLeft className="h-12 w-12" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Чат по товару
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.itemName}
                </p>
              </div>
            </div>

            {/* Admin Portal Switcher and Client Portal Toggle */}
            <div className="flex items-center space-x-4">
              {/* Admin Portal Switcher */}
              <AdminPortalSwitcherHeader />
            </div>
          </div>

          {/* Messages */}
          <ScrollArea
            className="flex-1 px-4 py-4"
            // eslint-disable-next-line react/no-unknown-property
            style={{
              height: isKeyboardOpen
                ? `calc(${window.visualViewport?.height || window.innerHeight}px - 200px)` // Full available height minus header and input
                : `calc(${actualViewportHeight || window.innerHeight}px - 200px)`, // Use actual viewport height for Android Chrome
            }}
          >
            {isLoadingMessages ? (
              <ChatLoader />
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isCurrentUser = message.sender === 'admin';
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
                      onDelete={handleDeleteClick}
                      onOpenMediaViewer={openMediaViewer}
                      canDelete={message.sender === 'admin'}
                      isDeleting={isDeleting}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div
            className={cn(
              'flex-shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
              isKeyboardOpen ? 'p-2 pb-1' : 'p-4 pb-4', // Ensure proper padding in normal mode
              isAndroidChrome && !isKeyboardOpen && 'mobile-chat-input' // Add safe area handling for Android Chrome
            )}
          >
            {/* Media Preview */}
            {draft.mediaItems.length > 0 && (
              <div className="mb-3">
                <MediaPreview
                  mediaItems={draft.mediaItems}
                  onRemove={removeMediaItem}
                />
              </div>
            )}

            {/* Service Message Toggle */}
            <div
              className={cn(
                'flex items-center space-x-2',
                isKeyboardOpen ? 'mb-2' : 'mb-3'
              )}
            >
              <Switch
                checked={draft.isService}
                onCheckedChange={updateIsService}
                id="service-message"
              />
              <label
                htmlFor="service-message"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Служебное сообщение
              </label>
            </div>

            {/* Text Input */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={draft.text}
                  onChange={e => updateText(e.target.value)}
                  placeholder="Введите сообщение..."
                  className={cn(
                    'auto-resize-textarea w-full pr-12',
                    isKeyboardOpen
                      ? 'max-h-20 min-h-[32px]'
                      : 'max-h-32 min-h-[44px]' // Increased minimum height for normal mode
                  )}
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
    </>
  );
}
