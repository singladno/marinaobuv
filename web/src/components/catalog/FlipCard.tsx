'use client';

import { useEffect, useState, useRef, ReactNode, memo } from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  delay?: number;
  className?: string;
}

export const FlipCard = memo(function FlipCard({
  front,
  back,
  isFlipped,
  delay = 0,
  className,
}: FlipCardProps) {
  const [shouldFlip, setShouldFlip] = useState(false);
  const hasFlippedRef = useRef(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prevIsFlippedRef = useRef(isFlipped);

  useEffect(() => {
    // Log prop changes
    if (prevIsFlippedRef.current !== isFlipped) {
      const stackTrace = new Error().stack?.split('\n').slice(1, 5).join('\n');
      console.log('[FlipCard] isFlipped prop changed:', {
        prev: prevIsFlippedRef.current,
        next: isFlipped,
        hasFlippedRef: hasFlippedRef.current,
        shouldFlip,
        delay,
        stackTrace,
      });
      prevIsFlippedRef.current = isFlipped;
    }

    // If already flipped, keep it flipped - never reset (prevents flickering)
    if (hasFlippedRef.current) {
      // Ensure shouldFlip stays true even if isFlipped prop changes
      if (!shouldFlip) {
        console.log('[FlipCard] Already flipped but shouldFlip is false, fixing...');
        setShouldFlip(true);
      }
      return;
    }

    if (isFlipped) {
      console.log('[FlipCard] Starting flip animation, delay:', delay);
      // Clear any pending animation
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Use requestAnimationFrame for better timing and smoother animation start
      rafIdRef.current = requestAnimationFrame(() => {
        animationTimerRef.current = setTimeout(() => {
          // Use another RAF to ensure animation starts on next frame
          const innerRafId = requestAnimationFrame(() => {
            console.log('[FlipCard] Setting shouldFlip to true');
            setShouldFlip(true);
            hasFlippedRef.current = true;
          });
          rafIdRef.current = innerRafId;
        }, delay);
      });

      return () => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }
      };
    }
    // Don't reset if already flipped - this prevents flickering on hover/re-renders
  }, [isFlipped, delay, shouldFlip]);

  return (
    <div className={cn('flip-card-container h-full', className)}>
      <div
        className={cn(
          'flip-card-content relative h-full transition-transform duration-1000',
          shouldFlip && 'flip-card-flipped'
        )}
      >
        <div
          className={cn(
            'flip-card-front absolute inset-0 h-full',
            shouldFlip
              ? 'pointer-events-none z-0'
              : 'pointer-events-auto z-[20]'
          )}
        >
          {front}
        </div>
        <div
          className={cn(
            'flip-card-back absolute inset-0 h-full',
            shouldFlip
              ? 'pointer-events-auto z-[20]'
              : 'pointer-events-none z-0'
          )}
        >
          {back}
        </div>
        {/* Spacer to maintain grid layout - uses the actual content that will be visible */}
        <div
          className="pointer-events-none invisible relative z-0 h-full"
          aria-hidden="true"
        >
          {shouldFlip ? back : front}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if isFlipped changes from false to true
  // Once flipped, never re-render due to prop changes (prevents flickering)
  if (prevProps.isFlipped === nextProps.isFlipped) {
    return true; // Props are equal, skip re-render
  }
  // If isFlipped changed from true to false, skip re-render (keep flipped state)
  if (prevProps.isFlipped && !nextProps.isFlipped) {
    console.log('[FlipCard] Memo: isFlipped changed from true to false, skipping re-render');
    return true; // Skip re-render to prevent reset
  }
  // Only re-render if isFlipped changes from false to true
  console.log('[FlipCard] Memo: isFlipped changed from false to true, allowing re-render');
  return false; // Props changed, allow re-render
});
