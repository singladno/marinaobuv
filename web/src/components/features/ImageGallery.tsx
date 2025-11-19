import * as React from 'react';

import { ImageModal } from '@/components/ui/ImageModal';
import { sanitizeImageUrl } from '@/lib/image-security';
import type { Draft } from '@/types/admin';

import { ImageGrid } from './ImageGrid';

interface ImageGalleryProps {
  draftId: string;
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
  singleRow?: boolean;
  maxVisible?: number;
}

export function ImageGallery({
  draftId,
  images,
  onImageToggle,
  onReload,
  singleRow,
  maxVisible,
}: ImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const activeImages = images?.filter(img => img.isActive !== false) || [];

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
      <ImageGrid
        draftId={draftId}
        images={images}
        onImageToggle={onImageToggle}
        onReload={onReload}
        onImageClick={openModal}
        singleRow={singleRow}
        maxVisible={maxVisible}
      />

      {isModalOpen && activeImages.length > 0 && (
        <ImageModal
          images={activeImages.map(img => ({
            id: img.id,
            url: sanitizeImageUrl(img.url),
            alt: img.alt || undefined,
            color: img.color || undefined,
            isActive: img.isActive !== false,
          }))}
          isOpen={isModalOpen}
          onClose={closeModal}
          initialIndex={selectedImageIndex}
        />
      )}
    </>
  );
}
