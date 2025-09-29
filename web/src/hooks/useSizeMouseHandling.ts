import { useState, useRef, useCallback, useEffect } from 'react';

export function useSizeMouseHandling() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sizeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const chipRefs = sizeRefs; // alias for compatibility with callers

  const setSizeRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      sizeRefs.current[index] = el;
    };
  }, []);

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
        setHoveredIndex(null);
      }
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [hoveredIndex]);

  // Compute floating delete button position near hovered chip
  const deleteButtonPosition = (() => {
    if (hoveredIndex === null) {
      return { top: -9999, left: -9999 };
    }
    const el = sizeRefs.current[hoveredIndex];
    if (!el) return { top: -9999, left: -9999 };
    const rect = el.getBoundingClientRect();
    return { top: rect.top - 6, left: rect.right - 6 };
  })();

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleDeleteButtonMouseEnter = useCallback(() => {
    // Keep visible when hovering the delete button
  }, []);

  const handleDeleteButtonMouseLeave = useCallback(() => {
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
