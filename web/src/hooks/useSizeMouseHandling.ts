import { useCallback, useRef, useState } from 'react';

export function useSizeMouseHandling(disabled: boolean) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    hoveredIndex,
    setHoveredIndex,
    deleteButtonPosition,
    chipRefs,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  };
}
