'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  radialWheelLeftArcDown,
  radialWheelLeftArcUp,
} from '@/lib/radial-menu-layout';

export type PortalRadialPlacement = 'bottomRightLeftUp' | 'topRightLeftDown';

type PortalRadialSlotsProps = {
  open: boolean;
  radius: number;
  placement: PortalRadialPlacement;
  items: ReactNode[];
  activeOrbitIndex?: number | null;
  onOrbitEnter?: (index: number) => void;
  onOrbitLeave?: () => void;
};

export function PortalRadialSlots({
  open,
  radius,
  placement,
  items,
  activeOrbitIndex = null,
  onOrbitEnter,
  onOrbitLeave,
}: PortalRadialSlotsProps) {
  const total = items.length;
  const offset =
    placement === 'bottomRightLeftUp'
      ? radialWheelLeftArcUp
      : radialWheelLeftArcDown;

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {items.map((node, i) => {
        const { dx, dy } = offset(i, total, radius);
        const isActive = activeOrbitIndex === i;
        return (
          <div
            key={i}
            className={cn(
              'pointer-events-auto absolute transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              open
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-50 opacity-0'
            )}
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
              transitionDelay: open ? `${i * 42}ms` : '0ms',
            }}
          >
            <div
              className={cn(
                'flex h-[52px] w-[52px] shrink-0 origin-center items-center justify-center rounded-full bg-transparent transition-all duration-200 ease-out',
                isActive && 'scale-110 brightness-110'
              )}
              onMouseEnter={() => onOrbitEnter?.(i)}
              onMouseLeave={() => onOrbitLeave?.()}
            >
              {node}
            </div>
          </div>
        );
      })}
    </div>
  );
}
