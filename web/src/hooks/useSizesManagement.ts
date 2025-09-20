import React, { useCallback, useState, useRef } from 'react';

import type { DraftSize } from '@/types/admin';

interface UseSizesManagementProps {
  sizes: DraftSize[];
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

export function useSizesManagement({
  sizes,
  onChange,
  disabled = false,
}: UseSizesManagementProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [localSizes, setLocalSizes] = useState<DraftSize[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingSizes, setUpdatingSizes] = useState<Set<string>>(new Set());
  const [lastApiCallTime, setLastApiCallTime] = useState<number>(0);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with props only when not updating and not recently after API call
  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastApiCall = now - lastApiCallTime;

    if (!isUpdating && timeSinceLastApiCall > 1000) {
      // Only sync if more than 1 second since last API call
      console.log('Syncing sizes from props:', sizes);
      // Transform database sizes to component format
      const sizesWithIds = (sizes || []).map((size, index) => ({
        id:
          size.id ||
          `size-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: size.size || '',
        quantity: size.quantity || size.stock || size.count || 0,
        isActive: size.isActive !== undefined ? size.isActive : true,
      }));
      console.log('Sizes with IDs:', sizesWithIds);
      setLocalSizes(sizesWithIds);
    }
  }, [sizes, isUpdating, lastApiCallTime]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleAddSize = useCallback(async () => {
    if (disabled) return;
    const newSize = {
      id: `size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: '',
      quantity: 0,
      isActive: true,
    };
    const updatedSizes = [...(localSizes || []), newSize];
    console.log('Adding new size:', newSize);
    console.log('Updated sizes:', updatedSizes);
    setLocalSizes(updatedSizes);

    // Track the new size as being updated
    setUpdatingSizes(prev => new Set(prev).add(newSize.id));
    setIsUpdating(true);
    try {
      await onChange(updatedSizes);
      console.log('API call completed');
      setLastApiCallTime(Date.now());
    } finally {
      setIsUpdating(false);
      // Remove the new size from updating set
      setUpdatingSizes(prev => {
        const newSet = new Set(prev);
        newSet.delete(newSize.id);
        return newSet;
      });
    }
  }, [disabled, localSizes, onChange]);

  const handleDeleteSize = useCallback(
    async (index: number) => {
      if (disabled) return;
      const sizeToDelete = localSizes[index];
      if (!sizeToDelete) return;

      const updatedSizes = (localSizes || []).filter((_, i) => i !== index);
      setLocalSizes(updatedSizes);

      // Track the deleted size as being updated
      setUpdatingSizes(prev => new Set(prev).add(sizeToDelete.id));
      setIsUpdating(true);
      try {
        await onChange(updatedSizes.length > 0 ? updatedSizes : []);
        setLastApiCallTime(Date.now());
      } finally {
        setIsUpdating(false);
        // Remove the deleted size from updating set
        setUpdatingSizes(prev => {
          const newSet = new Set(prev);
          newSet.delete(sizeToDelete.id);
          return newSet;
        });
      }
      setHoveredIndex(null);
    },
    [disabled, localSizes, onChange]
  );

  const handleSizeChange = useCallback(
    (index: number, field: 'size' | 'quantity', value: string | number) => {
      if (disabled) return;
      // Update local state immediately for responsive UI
      setLocalSizes(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [disabled]
  );

  const handleSizeBlur = useCallback(
    async (index: number) => {
      if (disabled) return;
      const size = localSizes[index];
      if (!size) return;

      // Track this specific size as being updated
      setUpdatingSizes(prev => new Set(prev).add(size.id));
      setIsUpdating(true);

      try {
        await onChange(localSizes);
        setLastApiCallTime(Date.now());
      } finally {
        setIsUpdating(false);
        // Remove this size from updating set
        setUpdatingSizes(prev => {
          const newSet = new Set(prev);
          newSet.delete(size.id);
          return newSet;
        });
      }
    },
    [disabled, localSizes, onChange]
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (disabled) return;

      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setHoveredIndex(index);

      const chipElement = chipRefs.current[index];
      if (chipElement) {
        const rect = chipElement.getBoundingClientRect();
        setDeleteButtonPosition({
          top: rect.top - 24, // 24px above the chip for better visibility
          left: rect.left + rect.width / 2 - 16, // Center horizontally, 16px is half of total area (32px with padding)
        });
      }
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    // Set a timeout to hide the delete button
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 150); // 150ms delay
  }, []);

  const handleDeleteButtonMouseEnter = useCallback(() => {
    // Clear hide timeout when hovering over delete button
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleDeleteButtonMouseLeave = useCallback(() => {
    // Hide immediately when leaving delete button
    setHoveredIndex(null);
  }, []);

  return {
    localSizes,
    isUpdating,
    updatingSizes,
    hoveredIndex,
    deleteButtonPosition,
    chipRefs,
    handleAddSize,
    handleDeleteSize,
    handleSizeChange,
    handleSizeBlur,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  };
}
