'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LEAVE_MS = 85;

/**
 * Keeps radial wedge + orbit icons in sync on hover (sector ↔ icon) with a short leave delay
 * so moving between the two does not flicker.
 */
export function usePortalOrbitHover() {
  const [activeOrbitIndex, setActiveOrbitIndex] = useState<number | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterOrbit = useCallback((index: number) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveOrbitIndex(index);
  }, []);

  const leaveOrbit = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveOrbitIndex(null);
      leaveTimerRef.current = null;
    }, LEAVE_MS);
  }, []);

  const resetOrbit = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveOrbitIndex(null);
  }, []);

  useEffect(
    () => () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    },
    []
  );

  return { activeOrbitIndex, enterOrbit, leaveOrbit, resetOrbit };
}
