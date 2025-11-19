import * as React from 'react';

import type { Draft } from '@/types/admin';

import { ImageActionButton } from './ImageActionButton';
import { ImageThumbnail } from './ImageThumbnail';

interface ImageGridItemProps {
  image: Draft['images'][number];
  index: number;
  extraCount: number;
  isLastVisible: boolean;
  singleRow?: boolean;
  canToggleImages: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onImageClick: (index: number) => void;
  registerRef: (imageId: string, node: HTMLDivElement | null) => void;
  imageRef: HTMLDivElement | null;
  isUpdating: boolean;
  onToggle: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => Promise<void> | void;
}

export function ImageGridItem({
  image,
  index,
  extraCount,
  isLastVisible,
  singleRow,
  canToggleImages,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onImageClick,
  registerRef,
  imageRef,
  isUpdating,
  onToggle,
}: ImageGridItemProps) {
  const handleRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerRef(image.id, node);
    },
    [image.id, registerRef]
  );

  const containerClasses = [
    'relative flex-shrink-0',
    singleRow ? 'w-12 min-w-12' : '',
    image.isActive === false ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const shouldShowOverlay = extraCount > 0 && isLastVisible;

  return (
    <div
      className={containerClasses}
      ref={handleRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ImageThumbnail
        image={image}
        onImageClick={onImageClick}
        onImageToggle={() => {}}
        isUpdating={false}
        index={index}
      />
      {shouldShowOverlay && (
        <button
          type="button"
          onClick={() => onImageClick(index)}
          className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 text-xs font-semibold text-white backdrop-blur-sm"
        >
          +{extraCount}
        </button>
      )}
      {canToggleImages && hovered && (
        <ImageActionButton
          imageId={image.id}
          isActive={image.isActive !== false}
          isUpdating={isUpdating}
          onToggle={onToggle}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          imageRef={imageRef}
        />
      )}
    </div>
  );
}
