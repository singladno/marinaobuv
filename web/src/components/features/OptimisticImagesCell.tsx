'use client';

import React, { useState, useRef } from 'react';

import { ImageModal } from '@/components/ui/ImageModal';
import { sanitizeImageUrl } from '@/lib/image-security';
type DraftImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sort: number;
  alt?: string | null;
  color?: string | null;
  isActive?: boolean;
};

import { OptimisticImageGrid } from './OptimisticImageGrid';

interface OptimisticImagesCellProps {
  draftId: string;
  images: DraftImage[];
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
}

export function OptimisticImagesCell({
  draftId,
  images,
  onImageToggle,
  onReload,
}: OptimisticImagesCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const activeImages = images.filter(img => img.isActive !== false);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    setSelectedImageIndex(prev =>
      prev < activeImages.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setSelectedImageIndex(prev =>
      prev > 0 ? prev - 1 : activeImages.length - 1
    );
  };

  return (
    <>
      <OptimisticImageGrid
        draftId={draftId}
        images={images}
        onImageToggle={onImageToggle}
        onReload={onReload}
        onImageClick={openModal}
      />

      {isModalOpen && activeImages.length > 0 && (
        <div ref={modalRef}>
          <ImageModal
            images={activeImages.map(img => ({
              id: img.id,
              url: sanitizeImageUrl(img.url),
              alt: img.alt || '',
              color: img.color || null,
              isActive: img.isActive,
            }))}
            isOpen={true}
            onClose={closeModal}
            initialIndex={selectedImageIndex}
          />
        </div>
      )}
    </>
  );
}
