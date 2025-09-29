'use client';

import React from 'react';

// Align with ImageModal images shape; drafts don't have a separate DraftImage type
type DraftImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sort: number;
  alt?: string | null;
  isFalseImage?: boolean;
  isActive?: boolean;
  color?: string | null;
};

import { ActiveImageGrid } from './ActiveImageGrid';
import { InactiveImageGrid } from './InactiveImageGrid';

interface OptimisticImageGridProps {
  draftId: string;
  images: DraftImage[];
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  onImageClick: (index: number) => void;
}

export function OptimisticImageGrid({
  draftId,
  images,
  onImageToggle,
  onReload,
  onImageClick,
}: OptimisticImageGridProps) {
  const activeImages = images.filter(img => img.isActive !== false);
  const inactiveImages = images.filter(img => img.isActive === false);

  return (
    <>
      <ActiveImageGrid
        draftId={draftId}
        images={activeImages}
        onImageToggle={onImageToggle}
        onReload={onReload}
        onImageClick={onImageClick}
      />

      <InactiveImageGrid
        draftId={draftId}
        images={inactiveImages}
        onImageToggle={onImageToggle}
        onReload={onReload}
        onImageClick={onImageClick}
      />
    </>
  );
}
