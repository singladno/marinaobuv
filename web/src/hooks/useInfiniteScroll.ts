import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Intersection observer root margin
}

export function useInfiniteScroll({
  hasNextPage,
  isLoading,
  onLoadMore,
  threshold = 100,
  rootMargin = '0px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const isTriggeringRef = useRef(false);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      // Prevent rapid-fire triggers (debounce)
      const now = Date.now();
      if (isTriggeringRef.current || now - lastTriggerTimeRef.current < 500) {
        return;
      }

      if (target.isIntersecting && hasNextPage && !isLoading) {
        lastTriggerTimeRef.current = now;
        isTriggeringRef.current = true;
        onLoadMore();

        // Reset trigger flag after a short delay
        setTimeout(() => {
          isTriggeringRef.current = false;
        }, 1000);
      }
    },
    [hasNextPage, isLoading, onLoadMore]
  );

  useEffect(() => {
    const currentObserver = new IntersectionObserver(handleObserver, {
      rootMargin: '100px', // Increased from default to trigger earlier
      threshold: 0.1,
    });

    observerRef.current = currentObserver;

    if (loadMoreRef.current) {
      currentObserver.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin]);

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreRef.current) {
      observerRef.current?.unobserve(loadMoreRef.current);
    }

    loadMoreRef.current = node;

    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  return { setLoadMoreRef };
}
