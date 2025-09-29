import { useState, useRef, useCallback, useEffect } from 'react';

export function useSizeMouseHandling() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sizeRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  return {
    hoveredIndex,
    setHoveredIndex,
    sizeRefs,
    setSizeRef,
  };
}
