'use client';

import { useId, type KeyboardEvent } from 'react';

import { cn } from '@/lib/utils';

/**
 * Quarter “pie” behind orbit icons. Geometry is authored for bottom-right FAB; for top-right
 * (`fabAnchor="topRight"`) the same paths are wrapped in a vertical flip so fills/gradients match desktop.
 */
const C = 800;
const R_OUTER = 780;
const R_DASH = Math.round(R_OUTER * 0.58);

export type PortalRadialFabAnchor = 'bottomRight' | 'topRight';

export type PortalRadialWheelBgProps = {
  open?: boolean;
  fabAnchor?: PortalRadialFabAnchor;
  onTopSectorClick?: () => void;
  onLeftSectorClick?: () => void;
  topSectorLabel?: string;
  leftSectorLabel?: string;
  leftSectorMapsToIndex?: 0 | 1;
  activeOrbitIndex?: number | null;
  onTopSectorPointerEnter?: () => void;
  onLeftSectorPointerEnter?: () => void;
  onSectorPointerLeave?: () => void;
};

export function PortalRadialWheelBg({
  open = true,
  fabAnchor = 'bottomRight',
  onTopSectorClick,
  onLeftSectorClick,
  topSectorLabel,
  leftSectorLabel,
  leftSectorMapsToIndex = 1,
  activeOrbitIndex = null,
  onTopSectorPointerEnter,
  onLeftSectorPointerEnter,
  onSectorPointerLeave,
}: PortalRadialWheelBgProps) {
  const safe = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `pw-fill-${safe}`;
  const rimId = `pw-rim-${safe}`;

  const k = R_OUTER / Math.SQRT2;
  const bx = C - k;
  const by = C - k;

  const isTopFab = fabAnchor === 'topRight';

  /** Bottom-right anchor in viewBox — (C,C) = FAB corner */
  const outerPath = `M ${C} ${C} L ${C - R_OUTER} ${C} A ${R_OUTER} ${R_OUTER} 0 0 1 ${C} ${C - R_OUTER} Z`;
  const outerArc = `M ${C} ${C} L ${C - R_OUTER} ${C} A ${R_OUTER} ${R_OUTER} 0 0 1 ${C} ${C - R_OUTER}`;
  const dashArc = `M ${C} ${C} L ${C - R_DASH} ${C} A ${R_DASH} ${R_DASH} 0 0 1 ${C} ${C - R_DASH}`;
  const bisector = `M ${C} ${C} L ${bx} ${by}`;
  const sectorLeftPath = `M ${C} ${C} L ${C - R_OUTER} ${C} A ${R_OUTER} ${R_OUTER} 0 0 1 ${bx} ${by} Z`;
  const sectorTopPath = `M ${C} ${C} L ${bx} ${by} A ${R_OUTER} ${R_OUTER} 0 0 1 ${C} ${C - R_OUTER} Z`;

  /** Maps y → 800 − y so bottom-right wedge becomes top-right (same colors as desktop) */
  const flipGroup = isTopFab ? 'translate(0, 800) scale(1, -1)' : undefined;

  const topActive = activeOrbitIndex === 0;
  const leftActive = activeOrbitIndex === leftSectorMapsToIndex;

  const hitBase = cn(
    'cursor-pointer transition-[fill] duration-150 focus:outline-none focus-visible:fill-white/[0.12]',
    open ? 'pointer-events-auto' : 'pointer-events-none'
  );

  const handleKey = (fn?: () => void) => (e: KeyboardEvent) => {
    if (!fn) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  const svgPositionStyle = isTopFab
    ? {
        right: '50%',
        top: '50%',
        bottom: 'auto' as const,
        transform: open
          ? 'translate(50%, -50%) scale(1)'
          : 'translate(50%, -50%) scale(0.42)',
        transformOrigin: '100% 0%' as const,
      }
    : {
        right: '50%',
        bottom: '50%',
        top: 'auto' as const,
        transform: open
          ? 'translate(50%, 50%) scale(1)'
          : 'translate(50%, 50%) scale(0.42)',
        transformOrigin: '100% 100%' as const,
      };

  return (
    <svg
      className="pointer-events-none absolute z-[12] h-[min(94vw,560px)] max-h-[560px] w-[min(94vw,560px)] max-w-[560px] drop-shadow-[0_10px_48px_rgba(91,33,182,0.2)] will-change-transform"
      style={{
        ...svgPositionStyle,
        opacity: open ? 1 : 0,
        transitionProperty: 'opacity, transform',
        transitionDuration: '320ms',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      viewBox={`0 0 ${C} ${C}`}
      aria-hidden={!open}
    >
      <defs>
        <radialGradient id={rimId} cx="100%" cy="100%" r="100%">
          <stop offset="0%" stopColor="rgba(49,46,129,0.22)" />
          <stop offset="50%" stopColor="rgba(109,40,217,0.18)" />
          <stop offset="100%" stopColor="rgba(234,52,234,0.12)" />
        </radialGradient>
        <linearGradient id={gradId} x1="100%" y1="100%" x2="2%" y2="2%">
          <stop offset="0%" stopColor="#5b21b6" stopOpacity="0.28" />
          <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.22" />
          <stop offset="72%" stopColor="#c084fc" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f0abfc" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <g transform={flipGroup}>
        <path
          d={outerPath}
          fill={`url(#${rimId})`}
          className="pointer-events-none"
        />
        <path
          d={outerPath}
          fill={`url(#${gradId})`}
          className="pointer-events-none"
        />

        {onLeftSectorClick ? (
          <path
            d={sectorLeftPath}
            className={cn(
              hitBase,
              leftActive ? 'fill-white/[0.12]' : 'fill-transparent'
            )}
            role="button"
            tabIndex={open ? 0 : -1}
            aria-label={leftSectorLabel}
            onClick={e => {
              e.stopPropagation();
              onLeftSectorClick();
            }}
            onKeyDown={handleKey(onLeftSectorClick)}
            onMouseEnter={onLeftSectorPointerEnter}
            onMouseLeave={onSectorPointerLeave}
          />
        ) : null}

        {onTopSectorClick ? (
          <path
            d={sectorTopPath}
            className={cn(
              hitBase,
              topActive ? 'fill-white/[0.12]' : 'fill-transparent'
            )}
            role="button"
            tabIndex={open ? 0 : -1}
            aria-label={topSectorLabel}
            onClick={e => {
              e.stopPropagation();
              onTopSectorClick();
            }}
            onKeyDown={handleKey(onTopSectorClick)}
            onMouseEnter={onTopSectorPointerEnter}
            onMouseLeave={onSectorPointerLeave}
          />
        ) : null}

        <path
          d={outerArc}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="2"
          className="pointer-events-none"
        />
        <path
          d={dashArc}
          fill="none"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth="1.25"
          strokeDasharray="8 7"
          className="pointer-events-none"
        />
        <path
          d={bisector}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="pointer-events-none"
        />
      </g>
    </svg>
  );
}
