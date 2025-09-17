import { useCallback, useRef } from 'react';

export function useSynchronizedScroll() {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleHeaderScroll = useCallback(() => {
    if (headerRef.current && bodyRef.current) {
      bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
    }
  }, []);

  const handleBodyScroll = useCallback(() => {
    if (headerRef.current && bodyRef.current) {
      headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
    }
  }, []);

  return {
    headerRef,
    bodyRef,
    handleHeaderScroll,
    handleBodyScroll,
  };
}
