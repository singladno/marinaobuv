'use client';

import React, { useState, useCallback } from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { Draft } from '@/types/admin';

type DraftImage = Draft['images'][0];

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

  const { handleImageToggle } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const handleToggleWithOptimistic = useCallback(
    async (imageId: string, isActive: boolean) => {
      setTogglingImages(prev => new Set(prev).add(imageId));
      try {
        // Create a synthetic MouseEvent for compatibility
        const event = new MouseEvent('click') as unknown as React.MouseEvent;
        await handleImageToggle(imageId, isActive, event);
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
              onImageClick={() => {
                const activeIndex = images.findIndex(
                  img => img.id === image.id
                );
                if (activeIndex !== -1) {
                  onImageClick(activeIndex);
                }
              }}
              onImageToggle={() => {}}
              isUpdating={false}
              index={images.findIndex(img => img.id === image.id)}
            />
            {hoveredImages.has(image.id) && (
              <div className="absolute -right-1 -top-1 z-10">
                <ImageActionButton
                  imageId={image.id}
                  isActive={image.isActive !== false}
                  isUpdating={togglingImages.has(image.id)}
                  onToggle={(id, active, e) =>
                    handleToggleWithOptimistic(id, active)
                  }
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
                  imageRef={null}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
