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

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      console.log('👁️ Intersection observer triggered:', {
        isIntersecting: target.isIntersecting,
        hasNextPage,
        isLoading,
      });
      if (target.isIntersecting && hasNextPage && !isLoading) {
        console.log('👁️ Triggering loadMore from intersection observer');
        onLoadMore();
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
