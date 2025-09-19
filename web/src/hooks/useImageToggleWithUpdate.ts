import * as React from 'react';

import type { Draft } from '@/types/admin';

import { useImageToggle } from './useImageToggle';

interface UseImageToggleWithUpdateProps {
  setLocalData: React.Dispatch<React.SetStateAction<Draft[]>>;
}

export function useImageToggleWithUpdate({
  setLocalData,
}: UseImageToggleWithUpdateProps) {
  const { handleImageToggle, savingStatus } = useImageToggle();

  const handleImageToggleWithUpdate = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      try {
        const updatedImage = await handleImageToggle(imageId, isActive);

        // Update local data with the actual server response
        setLocalData(prev =>
          prev.map(draft => ({
            ...draft,
            images: draft.images.map(img =>
              img.id === imageId ? { ...img, ...updatedImage } : img
            ),
          }))
        );
      } catch (error) {
        throw error;
      }
    },
    [handleImageToggle, setLocalData]
  );

  return {
    handleImageToggleWithUpdate,
    savingStatus,
  };
}
