'use client';

import { useState, useCallback } from 'react';
import { MediaItem } from '@/components/features/gruzchik/MediaPreview';

interface MediaDraftState {
  text: string;
  mediaItems: MediaItem[];
  isService: boolean;
}

export function useMediaDraft() {
  const [draft, setDraft] = useState<MediaDraftState>({
    text: '',
    mediaItems: [],
    isService: false,
  });

  const updateText = useCallback((text: string) => {
    setDraft(prev => ({ ...prev, text }));
  }, []);

  const updateIsService = useCallback((isService: boolean) => {
    setDraft(prev => ({ ...prev, isService }));
  }, []);

  const addMediaItems = useCallback((files: FileList) => {
    const newMediaItems: MediaItem[] = Array.from(files).map(file => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'document';

      let preview: string | undefined;
      if (type === 'image') {
        preview = URL.createObjectURL(file);
      }

      return {
        id,
        file,
        preview,
        type,
        progress: 0,
        isUploading: false,
      };
    });

    setDraft(prev => ({
      ...prev,
      mediaItems: [...prev.mediaItems, ...newMediaItems],
    }));
  }, []);

  const removeMediaItem = useCallback((id: string) => {
    setDraft(prev => {
      const itemToRemove = prev.mediaItems.find(item => item.id === id);
      if (itemToRemove?.preview) {
        URL.revokeObjectURL(itemToRemove.preview);
      }

      return {
        ...prev,
        mediaItems: prev.mediaItems.filter(item => item.id !== id),
      };
    });
  }, []);

  const updateMediaProgress = useCallback((id: string, progress: number) => {
    setDraft(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item =>
        item.id === id ? { ...item, progress, isUploading: true } : item
      ),
    }));
  }, []);

  const clearDraft = useCallback(() => {
    // Clean up object URLs
    draft.mediaItems.forEach(item => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

    setDraft({
      text: '',
      mediaItems: [],
      isService: false,
    });
  }, [draft.mediaItems]);

  const hasContent = draft.text.trim() || draft.mediaItems.length > 0;

  return {
    draft,
    updateText,
    updateIsService,
    addMediaItems,
    removeMediaItem,
    updateMediaProgress,
    clearDraft,
    hasContent,
  };
}
