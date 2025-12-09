'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { VideoCameraIcon } from '@heroicons/react/24/solid';

import { Text } from '@/components/ui/Text';
import { ProductVideoUploadArea } from './ProductVideoUploadArea';

export interface VideoFile {
  file?: File;
  preview: string;
  id: string;
  isDeleted?: boolean;
  url?: string; // For existing videos from server
  key?: string;
  alt?: string;
  sort?: number;
  duration?: number;
}

interface ProductVideoUploadProps {
  videos: VideoFile[];
  onVideosChange: (videos: VideoFile[]) => void;
  disabled?: boolean;
  maxVideos?: number;
}

export function ProductVideoUpload({
  videos,
  onVideosChange,
  disabled = false,
  maxVideos = 5,
}: ProductVideoUploadProps) {
  const handleFileSelect = (files: FileList) => {
    const newVideos: VideoFile[] = [];
    // Count only non-deleted videos for remaining slots
    const activeVideos = videos.filter(video => !video.isDeleted);
    const remainingSlots = maxVideos - activeVideos.length;

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach(file => {
        if (file.type.startsWith('video/')) {
          const preview = URL.createObjectURL(file);
          newVideos.push({
            file,
            preview,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            isDeleted: false,
          });
        }
      });

    if (newVideos.length > 0) {
      onVideosChange([...videos, ...newVideos]);
    }
  };

  const handleRemove = async (id: string) => {
    const videoToMarkDeleted = videos.find(video => video.id === id);
    if (!videoToMarkDeleted) return;

    // Mark video as deleted instead of removing it
    const updatedVideos = videos.map(video =>
      video.id === id ? { ...video, isDeleted: true } : video
    );

    // If this is an existing video (has URL), immediately update isActive status in the database
    if (
      videoToMarkDeleted.preview.startsWith('http') &&
      videoToMarkDeleted.id
    ) {
      try {
        const response = await fetch(
          `/api/admin/products/videos/${videoToMarkDeleted.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: false }),
          }
        );
        if (!response.ok) {
          console.error(`Failed to deactivate video ${videoToMarkDeleted.id}`);
        }
      } catch (error) {
        console.error(
          `Error deactivating video ${videoToMarkDeleted.id}:`,
          error
        );
      }
    }

    onVideosChange(updatedVideos);
  };

  const handleRestore = async (id: string) => {
    const videoToRestore = videos.find(video => video.id === id);
    if (!videoToRestore) return;

    // If this is an existing video (has URL), immediately update isActive status in the database
    if (videoToRestore.preview.startsWith('http') && videoToRestore.id) {
      try {
        const response = await fetch(
          `/api/admin/products/videos/${videoToRestore.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: true }),
          }
        );
        if (!response.ok) {
          console.error(`Failed to activate video ${videoToRestore.id}`);
        }
      } catch (error) {
        console.error(`Error activating video ${videoToRestore.id}:`, error);
      }
    }

    onVideosChange(
      videos.map(video =>
        video.id === id ? { ...video, isDeleted: false } : video
      )
    );
  };

  const activeVideos = useMemo(() => {
    return videos.filter(video => !video.isDeleted);
  }, [videos]);

  return (
    <div className="space-y-3">
      <Text
        variant="body"
        className="font-medium text-gray-900 dark:text-white"
      >
        Видео товара
      </Text>

      <ProductVideoUploadArea
        onFilesSelect={handleFileSelect}
        disabled={disabled}
        maxVideos={maxVideos}
        currentCount={activeVideos.length}
      />

      {activeVideos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {videos.map(video => {
            const isDeleted = video.isDeleted ?? false;
            const isExisting = video.preview.startsWith('http');

            return (
              <div key={video.id} className="space-y-2">
                <div
                  className={`group relative aspect-video overflow-hidden rounded-lg border-2 bg-gray-100 transition-all ${
                    isDeleted
                      ? 'opacity-50 grayscale'
                      : 'border-gray-200 dark:border-gray-700'
                  } dark:bg-gray-800`}
                >
                  {isExisting ? (
                    <Image
                      src={video.preview}
                      alt={video.alt || 'Video thumbnail'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 200px"
                    />
                  ) : (
                    <video
                      src={video.preview}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="none"
                      poster={undefined}
                    />
                  )}

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <VideoCameraIcon className="h-8 w-8 text-white" />
                  </div>

                  {isDeleted ? (
                    // Restore button when deleted
                    <button
                      type="button"
                      onClick={() => handleRestore(video.id)}
                      disabled={disabled}
                      className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-green-500 p-1.5 text-white transition-opacity hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-0"
                      aria-label="Восстановить видео"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    // Delete button
                    <button
                      type="button"
                      onClick={() => handleRemove(video.id)}
                      disabled={disabled}
                      className="source-icon-hover-toggle absolute right-2 top-2 z-20 cursor-pointer rounded-full bg-red-500 p-1.5 text-white transition-opacity hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-0"
                      aria-label="Удалить видео"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
