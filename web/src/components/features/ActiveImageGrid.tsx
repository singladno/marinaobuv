'use client';

import React, { useState, useCallback } from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { DraftImage } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface ActiveImageGridProps {
  draftId: string;
  images: DraftImage[];
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onImageClick: (index: number) => void;
}

export function ActiveImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
}: ActiveImageGridProps) {
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

  if (images.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-gray-500">
        Нет изображений
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative"
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
            onClick={() => onImageClick(index)}
            className="h-12 w-12 cursor-pointer rounded border border-gray-200 hover:border-blue-300"
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
  );
}
