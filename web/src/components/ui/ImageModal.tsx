import * as React from 'react';

import { useImageModalKeyboard } from '@/hooks/useImageModalKeyboard';
import { useImageSelection } from '@/hooks/useImageSelection';

import { ImageModalBadges } from './ImageModalBadges';
import { ImageModalHeader } from './ImageModalHeader';
import { ImageModalMainImage } from './ImageModalMainImage';
import { ImageModalNavigation } from './ImageModalNavigation';
import { ImageModalThumbnails } from './ImageModalThumbnails';
import { Modal } from './Modal';

interface ImageModalProps {
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    color?: string | null;
    isActive?: boolean;
  }>;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onImageToggle?: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  onBulkDelete?: (imageIds: string[]) => Promise<void>;
  onBulkSplit?: (imageIds: string[]) => Promise<void>;
  isUpdating?: string | null;
}

export function ImageModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  onImageToggle,
  onBulkDelete,
  onBulkSplit,
  isUpdating,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const {
    selectedImages,
    isBulkDeleting,
    isBulkSplitting,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    createBulkDeleteHandler,
    createBulkSplitHandler,
  } = useImageSelection({ images, isOpen });

  const handleBulkDelete = createBulkDeleteHandler(onBulkDelete);
  const handleBulkSplit = createBulkSplitHandler(onBulkSplit);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useImageModalKeyboard({
    isOpen,
    images,
    currentIndex,
    selectedImages,
    onImageToggle,
    onBulkDelete: handleBulkDelete,
    onImageSelect: (imageId: string) => {
      const index = images.findIndex(img => img.id === imageId);
      if (index !== -1) setCurrentIndex(index);
    },
    onToggleSelection: toggleImageSelection,
  });

  if (!isOpen || images.length === 0) return null;

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeCurrentIndex];

  // If currentImage is undefined, don't close the modal immediately
  // This prevents the modal from closing during image updates
  if (!currentImage) {
    // Only close if we have no images at all, not just a missing current image
    if (images.length === 0) {
      onClose();
      return null;
    }
    // If we have images but currentImage is undefined, just return null without closing
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Изображения"
      size="xl"
      className="!max-w-none"
      headerContent={
        <ImageModalHeader
          selectedCount={selectedImages.size}
          onSelectAll={selectAllImages}
          onDeselectAll={deselectAllImages}
          onBulkDelete={handleBulkDelete}
          onBulkSplit={handleBulkSplit}
          isBulkDeleting={isBulkDeleting}
          isBulkSplitting={isBulkSplitting}
          hasBulkDelete={!!onBulkDelete}
          hasBulkSplit={!!onBulkSplit}
        />
      }
    >
      <div className="relative">
        {/* Navigation buttons */}
        <ImageModalNavigation
          totalImages={images.length}
          onPrevious={() =>
            setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
          }
          onNext={() =>
            setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
          }
        />

        {/* Main image */}
        <ImageModalMainImage
          currentImage={currentImage}
          currentIndex={safeCurrentIndex}
          selectedImages={selectedImages}
          onImageToggle={onImageToggle}
          isUpdating={isUpdating}
        />

        {/* Badges */}
        <ImageModalBadges
          currentImage={currentImage}
          currentIndex={safeCurrentIndex}
          totalImages={images.length}
        />

        {/* Thumbnail strip */}
        <ImageModalThumbnails
          images={images}
          currentIndex={safeCurrentIndex}
          selectedImages={selectedImages}
          onImageSelect={setCurrentIndex}
          onToggleSelection={toggleImageSelection}
        />
      </div>
    </Modal>
  );
}
