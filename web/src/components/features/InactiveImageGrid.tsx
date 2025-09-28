'use client';

import React, { useState, useCallback } from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { DraftImage } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface InactiveImageGridProps {
  draftId: string;
  images: DraftImage[];
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onImageClick: (index: number) => void;
}

export function InactiveImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
}: InactiveImageGridProps) {
  const [togglingImages, setTogglingImages] = useState<Set<string>>(new Set());
  const [hoveredImages, setHoveredImages] = useState<Set<string>>(new Set());

  const { handleImageToggle, handleImageDelete } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const handleToggleWithOptimistic = useCallback(
    async (imageId: string, isActive: boolean) => {
      setTogglingImages(prev => new Set(prev).add(imageId));
      try {
        await handleImageToggle(imageId, isActive);
      } finally {
        setTogglingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    },
    [handleImageToggle]
  );

  if (images.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="text-xs text-gray-500">Скрытые:</div>
      <div className="flex flex-wrap gap-1">
        {images.map(image => (
          <div
            key={image.id}
            className="relative opacity-50"
            onMouseEnter={() =>
              setHoveredImages(prev => new Set(prev).add(image.id))
            }
            onMouseLeave={() =>
              setHoveredImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(image.id);
                return newSet;
              })
            }
          >
            <ImageThumbnail
              image={image}
              onClick={() => {
                const activeIndex = images.findIndex(
                  img => img.id === image.id
                );
                if (activeIndex !== -1) {
                  onImageClick(activeIndex);
                }
              }}
              className="h-8 w-8 cursor-pointer rounded border border-gray-200"
            />
            {hoveredImages.has(image.id) && (
              <div className="absolute -right-1 -top-1 z-10">
                <ImageActionButton
                  image={image}
                  onToggle={handleToggleWithOptimistic}
                  onDelete={handleImageDelete}
                  disabled={togglingImages.has(image.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
