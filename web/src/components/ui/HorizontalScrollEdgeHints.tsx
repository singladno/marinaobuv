'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

type Edge = 'left' | 'right' | null;

/** Flat side width (= semicircle radius); height is 2× this (diameter). */
const HALF_CIRCLE_W = 48;
const HALF_CIRCLE_H = HALF_CIRCLE_W * 2;
/** Horizontal distance from flat edge to centroid of a semicircular lamina (centers icon in the disk). */
const SEMICIRCLE_ICON_X = (4 * HALF_CIRCLE_W) / (3 * Math.PI);

export interface HorizontalScrollEdgeHintsProps {
  children: ReactNode;
  className?: string;
  /** Distance from the scroll edge (px) within which the control appears. Default 200. */
  hintZonePx?: number;
}

function scrollCaps(el: HTMLDivElement) {
  const max = el.scrollWidth - el.clientWidth;
  const sl = el.scrollLeft;
  return {
    maxScrollLeft: max,
    canLeft: sl > 1,
    canRight: sl < max - 1,
  };
}

/** Visible intersection of the scroll element with the window — for fixed overlays & vertical centering. */
function getViewportClipRect(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, 0);
  const bottom = Math.min(r.bottom, window.innerHeight);
  const height = bottom - top;
  if (height < 1) return null;
  return { left: r.left, top, width: r.width, height };
}

export function HorizontalScrollEdgeHints({
  children,
  className,
  hintZonePx = 200,
}: HorizontalScrollEdgeHintsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [caps, setCaps] = useState({ canLeft: false, canRight: false });
  const [hintSide, setHintSide] = useState<Edge>(null);
  const [scrollEdge, setScrollEdge] = useState<Edge>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [clip, setClip] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const refreshCaps = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { canLeft, canRight } = scrollCaps(el);
    setCaps(prev =>
      prev.canLeft === canLeft && prev.canRight === canRight
        ? prev
        : { canLeft, canRight }
    );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const updateClipRect = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setClip(getViewportClipRect(el));
  }, []);

  const syncLayout = useCallback(() => {
    refreshCaps();
    updateClipRect();
  }, [refreshCaps, updateClipRect]);

  const updateHintFromPoint = useCallback(
    (e: MouseEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const { canLeft, canRight } = scrollCaps(el);
      const x = e.clientX - r.left;
      const y = e.clientY;
      const w = r.width;

      if (
        y < r.top ||
        y > r.bottom ||
        e.clientX < r.left ||
        e.clientX > r.right
      ) {
        setHintSide(null);
        return;
      }

      let hint: Edge = null;
      if (canLeft && x >= 0 && x < hintZonePx) hint = 'left';
      else if (canRight && x >= w - hintZonePx && x < w) hint = 'right';

      setHintSide(hint);
    },
    [hintZonePx]
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    syncLayout();
    const ro = new ResizeObserver(() => syncLayout());
    ro.observe(el);
    window.addEventListener('resize', syncLayout);
    window.addEventListener('scroll', syncLayout, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncLayout);
      window.removeEventListener('scroll', syncLayout, true);
    };
  }, [syncLayout]);

  useEffect(() => {
    document.addEventListener('mousemove', updateHintFromPoint);
    return () => document.removeEventListener('mousemove', updateHintFromPoint);
  }, [updateHintFromPoint]);

  useEffect(() => {
    if (!scrollEdge) return;

    let raf = 0;
    const speed = reducedMotion ? 4.5 : 12;

    const tick = () => {
      const cur = scrollRef.current;
      if (!cur) return;

      const { maxScrollLeft, canLeft, canRight } = scrollCaps(cur);

      if (scrollEdge === 'left') {
        if (!canLeft) {
          setScrollEdge(null);
          refreshCaps();
          return;
        }
        cur.scrollLeft = Math.max(0, cur.scrollLeft - speed);
      } else if (scrollEdge === 'right') {
        if (!canRight) {
          setScrollEdge(null);
          refreshCaps();
          return;
        }
        cur.scrollLeft = Math.min(maxScrollLeft, cur.scrollLeft + speed);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollEdge, reducedMotion, refreshCaps]);

  const onScrollAreaScroll = syncLayout;

  /** Flat edge flush with the table side; curved side points into the scroll area. */
  const leftButtonStyle: CSSProperties | undefined = clip
    ? {
        position: 'fixed',
        left: clip.left,
        top: clip.top + (clip.height - HALF_CIRCLE_H) / 2,
        width: HALF_CIRCLE_W,
        height: HALF_CIRCLE_H,
        borderRadius: `0 ${HALF_CIRCLE_W}px ${HALF_CIRCLE_W}px 0`,
        zIndex: 40,
      }
    : undefined;

  const rightButtonStyle: CSSProperties | undefined = clip
    ? {
        position: 'fixed',
        left: clip.left + clip.width - HALF_CIRCLE_W,
        top: clip.top + (clip.height - HALF_CIRCLE_H) / 2,
        width: HALF_CIRCLE_W,
        height: HALF_CIRCLE_H,
        borderRadius: `${HALF_CIRCLE_W}px 0 0 ${HALF_CIRCLE_W}px`,
        zIndex: 40,
      }
    : undefined;

  const halfCircleClass =
    'relative cursor-default overflow-hidden text-sky-600 ring-1 ring-sky-200/50 shadow-[0_2px_12px_-2px_rgba(125,211,252,0.12)] transition-opacity duration-300 dark:text-sky-200 dark:ring-sky-600/35 dark:shadow-[0_2px_14px_-2px_rgba(0,0,0,0.22)]';

  /**
   * Sky-tinted glass: pale sky (50–200) so the hue stays even without backdrop-blur, but reads soft.
   */
  const halfCircleSurface =
    'pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/88 via-sky-100/76 to-sky-200/64 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] dark:from-sky-950/48 dark:via-sky-900/42 dark:to-sky-800/36 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]';

  const iconClass =
    'pointer-events-none absolute top-1/2 h-5 w-5 text-sky-500/75 dark:text-sky-300/75';

  return (
    <div className={cn('relative min-h-0 min-w-0', className)}>
      <div
        ref={scrollRef}
        className="h-full min-w-0 overflow-auto"
        onScroll={onScrollAreaScroll}
      >
        {children}
      </div>

      {clip && leftButtonStyle && (
        <div
          aria-hidden
          className={cn(
            halfCircleClass,
            caps.canLeft && hintSide === 'left'
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          style={leftButtonStyle}
          onMouseEnter={() => caps.canLeft && setScrollEdge('left')}
          onMouseLeave={() => setScrollEdge(e => (e === 'left' ? null : e))}
        >
          <span
            className={halfCircleSurface}
            style={{
              borderRadius: `0 ${HALF_CIRCLE_W}px ${HALF_CIRCLE_W}px 0`,
            }}
            aria-hidden
          />
          <ChevronLeft
            className={iconClass}
            strokeWidth={1.5}
            style={{
              left: SEMICIRCLE_ICON_X,
              transform: 'translate(-50%, -50%)',
            }}
            aria-hidden
          />
        </div>
      )}

      {clip && rightButtonStyle && (
        <div
          aria-hidden
          className={cn(
            halfCircleClass,
            caps.canRight && hintSide === 'right'
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          style={rightButtonStyle}
          onMouseEnter={() => caps.canRight && setScrollEdge('right')}
          onMouseLeave={() => setScrollEdge(e => (e === 'right' ? null : e))}
        >
          <span
            className={halfCircleSurface}
            style={{
              borderRadius: `${HALF_CIRCLE_W}px 0 0 ${HALF_CIRCLE_W}px`,
            }}
            aria-hidden
          />
          <ChevronRight
            className={iconClass}
            strokeWidth={1.5}
            style={{
              left: HALF_CIRCLE_W - SEMICIRCLE_ICON_X,
              transform: 'translate(-50%, -50%)',
            }}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
