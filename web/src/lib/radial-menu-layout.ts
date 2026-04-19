/**
 * Radial offsets for quick-menu orbits (bottom-right FAB on desktop).
 *
 * For **two** items we use a fixed “T” layout:
 * - index 0 → **top** (admin / client)
 * - index 1 → **left** (WhatsApp) — stays clear of the bottom viewport edge
 */

/** Desktop: FAB at bottom-right */
export function radialWheelLeftArcUp(
  index: number,
  total: number,
  radius: number
): { dx: number; dy: number } {
  const r = radius;

  if (total === 2) {
    if (index === 0) {
      // Admin / portal: straight above FAB center
      return { dx: -10, dy: -Math.round(r * 0.96) };
    }
    // WhatsApp: to the left, slightly above midline so nothing clips at the viewport bottom
    return { dx: -Math.round(r * 0.9), dy: -Math.round(r * 0.1) };
  }

  if (total === 1) {
    return { dx: -10, dy: -Math.round(r * 0.88) };
  }

  const degStart = 48;
  const degEnd = 122;
  const t = index / Math.max(1, total - 1);
  const deg = degStart + t * (degEnd - degStart);
  const beta = (deg * Math.PI) / 180;
  return {
    dx: -Math.sin(beta) * r,
    dy: -Math.cos(beta) * r,
  };
}

/**
 * Mobile: FAB at **top-right** — radial wedge opens **down-left** (mirrors desktop up-left).
 * Index 0 = “down” arm (admin / client), index 1 = “left” arm (WhatsApp).
 */
export function radialWheelLeftArcDown(
  index: number,
  total: number,
  radius: number
): { dx: number; dy: number } {
  const r = radius;

  if (total === 2) {
    if (index === 0) {
      return { dx: -10, dy: Math.round(r * 0.94) };
    }
    return { dx: -Math.round(r * 0.88), dy: Math.round(r * 0.12) };
  }

  if (total === 1) {
    return { dx: -Math.round(r * 0.78), dy: Math.round(r * 0.42) };
  }

  const degStart = 12;
  const degEnd = 108;
  const t = index / Math.max(1, total - 1);
  const deg = degStart + t * (degEnd - degStart);
  const beta = (deg * Math.PI) / 180;
  return {
    dx: -Math.sin(beta) * r,
    dy: Math.cos(beta) * r,
  };
}
