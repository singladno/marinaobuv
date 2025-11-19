'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';

export function useTextareaAutoResize(
  ref: RefObject<HTMLTextAreaElement>,
  enabled: boolean,
  deps: React.DependencyList = []
) {
  const resize = useCallback(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.max(el.scrollHeight, el.offsetHeight || 40);
    el.style.height = `${newHeight}px`;
    el.style.maxHeight = 'none';
    el.style.overflow = 'hidden';
  }, [enabled, ref]);

  useEffect(() => {
    if (!enabled) return;
    resize();
    const timer = setTimeout(resize, 100);
    return () => clearTimeout(timer);
  }, [enabled, resize, ...deps]);

  useEffect(() => {
    if (!enabled) return;
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, resize]);

  return resize;
}
