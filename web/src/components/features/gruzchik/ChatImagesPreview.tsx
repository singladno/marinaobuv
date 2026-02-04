'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import Image from 'next/image';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { MediaViewerModal } from './MediaViewerModal';
import { cn } from '@/lib/utils';

interface ChatImagesPreviewProps {
  itemId: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  text: string | null;
  sender: 'gruzchik' | 'client' | 'admin';
  senderName?: string;
  timestamp: string;
  isService: boolean;
  attachments?: Array<{
    type: string;
    name: string;
    size?: number;
    data?: string;
    url?: string;
  }>;
}

export function ChatImagesPreview({
  itemId,
  className,
}: ChatImagesPreviewProps) {
  const { filters } = useGruzchikFilter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);

  // Use deferred value to avoid blocking UI updates
  const deferredShowImages = useDeferredValue(filters.showImages);

  // Extract all images from messages when showImages is true
  const allImages = useMemo(() => {
    if (!deferredShowImages || !messages || messages.length === 0) return [];
    return messages.flatMap(msg =>
      (msg.attachments || [])
        .filter(att => att.type.startsWith('image/'))
        .map(att => ({
          type: att.type,
          name: att.name,
          data: att.data,
          url: att.url,
          messageId: msg.id,
        }))
        .filter(img => img.data || img.url)
    );
  }, [deferredShowImages, messages]);

  // Fetch messages when showImages is enabled
  useEffect(() => {
    if (!filters.showImages) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/gruzchik/order-items/${itemId}/messages`
        );
        const data = await response.json();

        if (data.success) {
          const formattedMessages: ChatMessage[] = data.messages.map(
            (msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              senderName: msg.senderName,
              timestamp: msg.timestamp,
              isService: msg.isService,
              attachments: msg.attachments,
            })
          );
          setMessages(formattedMessages);
        } else {
          console.error('Failed to fetch messages:', data.error);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [itemId, filters.showImages]);

  const handleImageClick = (index: number) => {
    setMediaViewerIndex(index);
    setMediaViewerOpen(true);
  };

  // Don't render anything if showImages is false
  if (!filters.showImages) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-2', className)}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Show empty state if no images
  if (allImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn('mt-2 space-y-2', className)}>
        <div className="text-xs font-medium text-gray-600">
          Изображения из чата ({allImages.length})
        </div>
        <div className="flex flex-row gap-2 overflow-x-auto">
          {allImages.map((img, idx) => (
            <div
              key={`${img.messageId}-${idx}`}
              className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-opacity hover:opacity-80 dark:border-gray-700 dark:bg-gray-800"
              onClick={() => handleImageClick(idx)}
            >
              <Image
                src={img.data || img.url || ''}
                alt={img.name || 'Изображение из чата'}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
      {mediaViewerOpen && allImages.length > 0 && (
        <MediaViewerModal
          onClose={() => setMediaViewerOpen(false)}
          mediaItems={allImages.map(img => ({
            type: img.type,
            name: img.name || 'Изображение',
            data: img.data,
            url: img.url,
          }))}
          initialIndex={mediaViewerIndex}
        />
      )}
    </>
  );
}
