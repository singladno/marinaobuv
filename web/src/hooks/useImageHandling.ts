import * as React from 'react';

// import type { Draft } from '@/types/admin';

import { useProductSplit } from './useProductSplit';

interface UseImageHandlingProps {
  draftId: string;
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
}

export function useImageHandling({
  draftId,
  onImageToggle,
  onReload,
}: UseImageHandlingProps) {
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

  const { splitProduct, isSplitting } = useProductSplit({
    draftId,
    onSuccess: () => {
      // Reload data to show the new split items
      if (onReload) {
        onReload();
      }
    },
  });

  const handleImageToggle = React.useCallback(
    async (imageId: string, isActive: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onImageToggle || isUpdating) return;
      setIsUpdating(imageId);
      try {
        await onImageToggle(imageId, isActive);
      } catch (error) {
        console.error('Failed to toggle image status:', error);
      } finally {
        setIsUpdating(null);
      }
    },
    [onImageToggle, isUpdating]
  );

  const handleBulkDelete = React.useCallback(
    async (imageIds: string[]) => {
      if (!onImageToggle || isUpdating) return;
      setIsUpdating('bulk');
      try {
        // Delete all selected images
        await Promise.all(
          imageIds.map(imageId => onImageToggle(imageId, false))
        );
      } catch (error) {
        console.error('Failed to bulk delete images:', error);
      } finally {
        setIsUpdating(null);
      }
    },
    [onImageToggle, isUpdating]
  );

  const handleBulkSplit = React.useCallback(
    async (imageIds: string[]) => {
      if (isUpdating || isSplitting) return;
      setIsUpdating('split');
      try {
        await splitProduct(imageIds);
      } catch (error) {
        console.error('Failed to split product:', error);
      } finally {
        setIsUpdating(null);
      }
    },
    [isUpdating, isSplitting, splitProduct]
  );

  return {
    isUpdating,
    isSplitting,
    handleImageToggle,
    handleBulkDelete,
    handleBulkSplit,
  };
}
