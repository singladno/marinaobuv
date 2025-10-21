import * as React from 'react';

interface UseImageSelectionProps {
  images: Array<{ id: string }>;
  isOpen: boolean;
}

export function useImageSelection({ images, isOpen }: UseImageSelectionProps) {
  const [selectedImages, setSelectedImages] = React.useState<Set<string>>(
    new Set()
  );
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isBulkSplitting, setIsBulkSplitting] = React.useState(false);

  // Reset selection when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedImages(new Set());
    }
  }, [isOpen]);

  const toggleImageSelection = React.useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  const selectAllImages = React.useCallback(() => {
    setSelectedImages(new Set(images.map(img => img.id)));
  }, [images]);

  const deselectAllImages = React.useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const createBulkDeleteHandler = React.useCallback(
    (onBulkDelete?: (imageIds: string[]) => Promise<void>) => {
      return async () => {
        if (!onBulkDelete || selectedImages.size === 0) return;

        setIsBulkDeleting(true);
        try {
          await onBulkDelete(Array.from(selectedImages));
          setSelectedImages(new Set());
        } catch (error) {
          console.error('Bulk delete failed:', error);
        } finally {
          setIsBulkDeleting(false);
        }
      };
    },
    [selectedImages]
  );

  const createBulkSplitHandler = React.useCallback(
    (onBulkSplit?: (imageIds: string[]) => Promise<void>) => {
      return async () => {
        if (!onBulkSplit || selectedImages.size === 0) return;

        setIsBulkSplitting(true);
        try {
          await onBulkSplit(Array.from(selectedImages));
          setSelectedImages(new Set());
        } catch (error) {
          console.error('Bulk split failed:', error);
        } finally {
          setIsBulkSplitting(false);
        }
      };
    },
    [selectedImages]
  );

  return {
    selectedImages,
    isBulkDeleting,
    isBulkSplitting,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    createBulkDeleteHandler,
    createBulkSplitHandler,
  };
}
