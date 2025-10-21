'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';

import { useImageHandling } from '@/hooks/useImageHandling';
import type { Draft } from '@/types/admin';

type DraftImage = Draft['images'][0];

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

  const { handleImageToggle } = useImageHandling({
    draftId,
    onImageToggle,
    onReload,
  });

  const handleToggleWithOptimistic = useCallback(
    async (imageId: string, isActive: boolean) => {
      setTogglingImages(prev => new Set(prev).add(imageId));
      try {
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

  const containerRefs = useMemo(
    () => images.map(() => React.createRef<HTMLDivElement>()),
    [images]
  );

  if (images.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-gray-500">
        Нет изображений
      </div>
    );
  }

  // Pre-create stable refs for each image index to avoid hooks in loops

  return (
    <div className="flex flex-wrap gap-1">
      {images.map((image, index) => {
        const isUpdating = togglingImages.has(image.id);
        const isActive = image.isActive === true;
        return (
          <div
            key={image.id}
            ref={containerRefs[index]}
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
              onImageClick={onImageClick}
              onImageToggle={() => {}}
              isUpdating={isUpdating}
              index={index}
            />
            {hoveredImages.has(image.id) && (
              <ImageActionButton
                imageId={image.id}
                isActive={isActive}
                isUpdating={isUpdating}
                onToggle={(imageId, next, e) =>
                  handleImageToggle(imageId, next, e)
                }
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                imageRef={containerRefs[index].current}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
