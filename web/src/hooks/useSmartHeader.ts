'use client';

import { useEffect, useState } from 'react';

interface UseSmartHeaderOptions {
  showDuration?: number; // Duration to show header after scroll (in ms)
  threshold?: number; // Scroll threshold to trigger behavior
}

export function useSmartHeader(options: UseSmartHeaderOptions = {}) {
  const { showDuration = 3000, threshold = 10 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isCurrentlyAtTop = currentScrollY <= threshold;

      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Always show when at top
      if (isCurrentlyAtTop) {
        setIsAtTop(true);
        setIsVisible(true);
        setIsScrolling(false);
        setLastScrollY(currentScrollY);
        return;
      }

      setIsAtTop(false);

      // Check if user is scrolling down
      const isScrollingDown = currentScrollY > lastScrollY;

      if (isScrollingDown && currentScrollY > threshold) {
        // User is scrolling down - hide header
        setIsVisible(false);
        setIsScrolling(false);
      } else if (!isScrollingDown) {
        // User is scrolling up - show header temporarily
        setIsVisible(true);
        setIsScrolling(true);

        // Hide header after showDuration
        timeoutId = setTimeout(() => {
          setIsVisible(false);
          setIsScrolling(false);
        }, showDuration);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastScrollY, showDuration, threshold]);

  return {
    isVisible,
    isScrolling,
    isAtTop,
  };
}
