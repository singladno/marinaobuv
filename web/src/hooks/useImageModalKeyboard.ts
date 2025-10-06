import * as React from 'react';

interface UseImageModalKeyboardProps {
  isOpen: boolean;
  images: Array<{ id: string; isActive?: boolean }>;
  currentIndex: number;
  selectedImages: Set<string>;
  onImageToggle?: (
    imageId: string,
    isActive: boolean,
    event: React.MouseEvent
  ) => void;
  onBulkDelete?: () => void;
  onImageSelect: (imageId: string) => void;
  onToggleSelection: (imageId: string) => void;
}

export function useImageModalKeyboard({
  isOpen,
  images,
  currentIndex,
  selectedImages,
  onImageToggle,
  onBulkDelete,
  onImageSelect,
  onToggleSelection,
}: UseImageModalKeyboardProps) {
  React.useEffect(() => {
    if (!isOpen || images.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        const prevImage = images[prevIndex];
        if (prevImage) {
          onImageSelect(prevImage.id);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = Math.min(images.length - 1, currentIndex + 1);
        const nextImage = images[nextIndex];
        if (nextImage) {
          onImageSelect(nextImage.id);
        }
      } else if (e.key === ' ') {
        // Spacebar to select/deselect current image
        e.preventDefault();
        const safeIndex = Math.min(currentIndex, images.length - 1);
        const currentImage = images[safeIndex];
        if (currentImage) {
          onToggleSelection(currentImage.id);
        }
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        images.length > 0
      ) {
        e.preventDefault();
        if (selectedImages.size > 0 && onBulkDelete) {
          // Bulk delete selected images
          onBulkDelete();
        } else if (onImageToggle) {
          // Single image toggle (delete/restore based on current state)
          const safeIndex = Math.min(currentIndex, images.length - 1);
          const currentImage = images[safeIndex];
          if (currentImage) {
            const isActive = currentImage.isActive === true;
            onImageToggle(
              currentImage.id,
              !isActive,
              e as unknown as React.MouseEvent
            );
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    images.length,
    onImageToggle,
    onBulkDelete,
    currentIndex,
    images,
    selectedImages.size,
    onImageSelect,
    onToggleSelection,
  ]);
}
