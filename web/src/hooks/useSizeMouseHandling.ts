import { useState, useRef, useCallback, useEffect } from 'react';

export function useSizeMouseHandling() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHoveringDeleteButton, setIsHoveringDeleteButton] = useState(false);
  const sizeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const chipRefs = sizeRefs; // alias for compatibility with callers
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setSizeRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      sizeRefs.current[index] = el;
    };
  }, []);

  // Clear timeout when component unmounts or hoveredIndex changes
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [hoveredIndex]);

  useEffect(() => {
    if (hoveredIndex === null) return;
    const handleMove = (e: MouseEvent) => {
      const el = sizeRefs.current[hoveredIndex!];
      if (!el) {
        setHoveredIndex(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        // Add delay before hiding to allow user to move to delete button
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
          if (!isHoveringDeleteButton) {
            setHoveredIndex(null);
          }
        }, 300); // 300ms delay
      }
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [hoveredIndex, isHoveringDeleteButton]);

  // Compute floating delete button position near hovered chip
  const deleteButtonPosition = (() => {
    if (hoveredIndex === null) {
      return { top: -9999, left: -9999 };
    }
    const el = sizeRefs.current[hoveredIndex];
    if (!el) return { top: -9999, left: -9999 };
    const rect = el.getBoundingClientRect();
    // Position above the size chip at the top center
    return {
      top: rect.top - 30, // Move higher above the size chip
      left: rect.left + rect.width / 2 - 16, // Center horizontally (16px is half the button width: 24px + 4px padding on each side)
    };
  })();

  const handleMouseEnter = useCallback((index: number) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Don't immediately hide, let the timeout handle it
  }, []);

  const handleDeleteButtonMouseEnter = useCallback(() => {
    setIsHoveringDeleteButton(true);
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleDeleteButtonMouseLeave = useCallback(() => {
    setIsHoveringDeleteButton(false);
    setHoveredIndex(null);
  }, []);

  return {
    hoveredIndex,
    setHoveredIndex,
    sizeRefs,
    setSizeRef,
    chipRefs,
    deleteButtonPosition,
    handleMouseEnter,
    handleMouseLeave,
    handleDeleteButtonMouseEnter,
    handleDeleteButtonMouseLeave,
  };
}
