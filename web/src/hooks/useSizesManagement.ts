import { useCallback } from 'react';

import type { DraftSize } from '@/types/admin';

import { useSizeMouseHandling } from './useSizeMouseHandling';
import { useSizeOperations } from './useSizeOperations';

interface UseSizesManagementProps {
  sizes: Array<{
    size: string;
    stock?: number;
    count?: number;
    quantity?: number;
    id?: string;
    isActive?: boolean;
  }> | null;
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

export function useSizesManagement({
  sizes,
  onChange,
  disabled = false,
}: UseSizesManagementProps) {
  const {
    localSizes,
    isUpdating,
    updatingSizes,
    handleAddSize,
    handleDeleteSize,
    handleSizeChange,
    handleSizeBlur,
  } = useSizeOperations({ sizes, onChange, disabled });

  const {
    hoveredIndex,
    setHoveredIndex,
    deleteButtonPosition,
    chipRefs,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  } = useSizeMouseHandling();

  // Enhanced delete handler that also clears hover state
  const handleDeleteSizeWithHover = useCallback(
    async (index: number) => {
      await handleDeleteSize(index);
      setHoveredIndex(null);
    },
    [handleDeleteSize, setHoveredIndex]
  );

  return {
    localSizes,
    isUpdating,
    updatingSizes,
    hoveredIndex,
    deleteButtonPosition,
    chipRefs,
    handleAddSize,
    handleDeleteSize: handleDeleteSizeWithHover,
    handleSizeChange,
    handleSizeBlur,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  };
}
