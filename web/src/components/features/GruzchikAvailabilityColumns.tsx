'use client';

import { createGruzchikAvailabilityColumns as createColumns } from '@/utils/gruzchikColumnDefinitions';

export function createGruzchikAvailabilityColumns({
  onUpdate,
  updatingOrders,
}: {
  onUpdate?: (
    orderId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
  updatingOrders: Set<string>;
}) {
  return createColumns({ onUpdate, updatingOrders });
}
