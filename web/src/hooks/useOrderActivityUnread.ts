import { useCallback, useEffect, useState } from 'react';

import {
  countActivityEventsUnseen,
  getOrderActivitySeenAt,
  setOrderActivitySeenAt,
} from '@/lib/order-activity-read-storage';

type ActivityLight = { at: string };

/**
 * Fetches the activity timeline and counts entries newer than the last
 * "seen" time stored for this order (set when the history modal shows loaded events).
 */
export function useOrderActivityUnread(
  orderId: string | null,
  refreshKey: number
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refetch = useCallback(async () => {
    if (!orderId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/activity`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const events: ActivityLight[] = Array.isArray(data.events)
        ? data.events
        : [];
      const times = events.map(e => e.at);
      const seen = getOrderActivitySeenAt(orderId);
      setUnreadCount(countActivityEventsUnseen(times, seen));
    } catch {
      /* keep previous count */
    }
  }, [orderId]);

  useEffect(() => {
    void refetch();
  }, [orderId, refreshKey, refetch]);

  const markSeenUpTo = useCallback(
    (newestIso: string) => {
      if (!orderId) return;
      if (!newestIso) return;
      const prev = getOrderActivitySeenAt(orderId);
      if (!prev || newestIso > prev) {
        setOrderActivitySeenAt(orderId, newestIso);
      }
      setUnreadCount(0);
    },
    [orderId]
  );

  return { unreadCount, markSeenUpTo, refetch };
}
