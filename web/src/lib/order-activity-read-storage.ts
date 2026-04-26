const storageKey = (orderId: string) =>
  `marinaobuv:admin:order-activity-seen-at:${orderId}`;

/** Latest activity timestamp the admin has "seen" in the history modal (ISO string). */
export function getOrderActivitySeenAt(orderId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(storageKey(orderId));
  } catch {
    return null;
  }
}

export function setOrderActivitySeenAt(orderId: string, iso: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(orderId), iso);
  } catch {
    /* ignore quota / private mode */
  }
}

export function countActivityEventsUnseen(
  eventTimesIso: string[],
  seenAtIso: string | null
): number {
  if (eventTimesIso.length === 0) return 0;
  if (seenAtIso == null) return eventTimesIso.length;
  const seenMs = new Date(seenAtIso).getTime();
  if (Number.isNaN(seenMs)) return eventTimesIso.length;
  return eventTimesIso.filter(t => new Date(t).getTime() > seenMs).length;
}
