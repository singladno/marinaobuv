'use client';

import { useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  delay?: number;
  className?: string;
}

export function FlipCard({
  front,
  back,
  isFlipped,
  delay = 0,
  className,
}: FlipCardProps) {
  const [shouldFlip, setShouldFlip] = useState(false);

  useEffect(() => {
    if (isFlipped) {
      // Use requestAnimationFrame for better timing and smoother animation start
      let timer: NodeJS.Timeout;

      const rafId = requestAnimationFrame(() => {
        timer = setTimeout(() => {
          // Use another RAF to ensure animation starts on next frame
          requestAnimationFrame(() => {
            setShouldFlip(true);
          });
        }, delay);
      });

      return () => {
        cancelAnimationFrame(rafId);
        if (timer) clearTimeout(timer);
      };
    } else {
      setShouldFlip(false);
    }
  }, [isFlipped, delay]);

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
}
