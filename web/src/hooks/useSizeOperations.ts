import React, { useCallback, useState } from 'react';

import type { DraftSize } from '@/types/admin';
import { sortSizesAscending } from '@/utils/sizeSort';

interface UseSizeOperationsProps {
  sizes: Array<{
    size: string;
    stock?: number;
    count?: number;
    quantity?: number;
    id?: string;
    isActive?: boolean;
  }> | null;
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled: boolean;
}

// Helper function to parse size data
function parseSizeData(size: any, index: number): DraftSize {
  // Parse size string to extract size and quantity
  // Handle cases like "38.2" where "38" is size and "2" is quantity
  let parsedSize = size.size || '';
  let parsedQuantity = size.quantity || size.stock || size.count || 0;

  // If size contains a dot and no explicit quantity, parse it
  if (parsedSize.includes('.') && parsedQuantity === 0) {
    const parts = parsedSize.split('.');
    if (parts.length === 2) {
      parsedSize = parts[0]; // "38"
      parsedQuantity = parseInt(parts[1]) || 0; // "2"
    }
  }

  return {
    id:
      size.id ||
      `size-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    size: parsedSize,
    quantity: parsedQuantity,
    isActive: size.isActive !== undefined ? size.isActive : true,
  };
}

export function useSizeOperations({
  sizes,
  onChange,
  disabled,
}: UseSizeOperationsProps) {
  const [localSizes, setLocalSizes] = useState<DraftSize[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingSizes, setUpdatingSizes] = useState<Set<string>>(new Set());
  const [lastApiCallTime, setLastApiCallTime] = useState<number>(0);

  // Sync local state with props
  React.useEffect(() => {
    if (sizes && sizes.length > 0) {
      // Transform database sizes to component format
      const sizesWithIds = sizes.map((size, index) =>
        parseSizeData(size, index)
      );
      // Sort sizes in ascending order
      const sortedSizes = sortSizesAscending(sizesWithIds);
      setLocalSizes(sortedSizes);
    }
  }, [sizes]);

  const handleAddSize = useCallback(async () => {
    if (disabled) return;
    const newSize = {
      id: `size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: '',
      quantity: 0,
      isActive: true,
    };
    const updatedSizes = [...(localSizes || []), newSize];
    // Sort the updated sizes to maintain ascending order
    const sortedSizes = sortSizesAscending(updatedSizes);
    setLocalSizes(sortedSizes);

    // Track the new size as being updated
    setUpdatingSizes(prev => new Set(prev).add(newSize.id));
    setIsUpdating(true);
    try {
      await onChange(sortedSizes);
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
      // Sort the remaining sizes to maintain ascending order
      const sortedSizes = sortSizesAscending(updatedSizes);
      setLocalSizes(sortedSizes);

      // Track the deleted size as being updated
      setUpdatingSizes(prev => new Set(prev).add(sizeToDelete.id));
      setIsUpdating(true);
      try {
        await onChange(sortedSizes.length > 0 ? sortedSizes : []);
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

      // Sort sizes after editing to maintain ascending order
      const sortedSizes = sortSizesAscending(localSizes);
      setLocalSizes(sortedSizes);

      // Track this specific size as being updated
      setUpdatingSizes(prev => new Set(prev).add(size.id));
      setIsUpdating(true);

      try {
        await onChange(sortedSizes);
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

  return {
    localSizes,
    setLocalSizes,
    isUpdating,
    updatingSizes,
    lastApiCallTime,
    setLastApiCallTime,
    handleAddSize,
    handleDeleteSize,
    handleSizeChange,
    handleSizeBlur,
  };
}
