'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseScrollArrowsOptions {
  // Pixels from top to start showing the Up arrow
  showUpAfterPx?: number;
  // Pixels from bottom to hide the Down arrow
  bottomThresholdPx?: number;
  // Show Up arrow only when viewport is within bottom portion of the page
  bottomPortionRatio?: number; // 0..1, default 0.6 (60%)
  // Optional scroll container element (defaults to window/document)
  container?: HTMLElement | null;
}

export function useScrollArrows(options: UseScrollArrowsOptions = {}) {
  const {
    showUpAfterPx = 300,
    bottomThresholdPx = 300,
    bottomPortionRatio = 0.6,
    container,
  } = options;

  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const frameRequested = useRef(false);

  const compute = useCallback(() => {
    const el = container || document.documentElement;
    const scrollTop = el.scrollTop || window.pageYOffset;
    const viewportH = container ? el.clientHeight : window.innerHeight;
    const scrollH = el.scrollHeight;

    const canScroll = scrollH - viewportH > 4; // minimal buffer so arrows appear if barely scrollable
    const atBottom = scrollTop + viewportH >= scrollH - bottomThresholdPx;
    const inBottomPortion =
      scrollTop + viewportH >= scrollH * bottomPortionRatio;

    setShowUp(canScroll && inBottomPortion);
    setShowDown(canScroll && !atBottom);
  }, [bottomThresholdPx, bottomPortionRatio, container]);

  useEffect(() => {
    const target = container || window;
    const onScrollOrResize = () => {
      if (frameRequested.current) return;
      frameRequested.current = true;
      requestAnimationFrame(() => {
        frameRequested.current = false;
        compute();
      });
    };

    compute();
    (target as any).addEventListener('scroll', onScrollOrResize, {
      passive: true,
    });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      (target as any).removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [compute, container]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    const doc = document.documentElement;
    window.scrollTo({ top: doc.scrollHeight, behavior: 'smooth' });
  }, []);

  return useMemo(
    () => ({ showUp, showDown, scrollToTop, scrollToBottom }),
    [showUp, showDown, scrollToTop, scrollToBottom]
  );
}

export default useScrollArrows;
