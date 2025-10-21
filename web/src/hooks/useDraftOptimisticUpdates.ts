import * as React from 'react';

import type { Draft } from '@/types/admin';

export function useDraftOptimisticUpdates() {
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<
    Map<string, Partial<Draft>>
  >(new Map());
  const [pendingOperations, setPendingOperations] = React.useState<Set<string>>(
    new Set()
  );

  const setOptimisticUpdate = React.useCallback(
    (id: string, updates: Partial<Draft>) => {
      setOptimisticUpdates(prev => {
        const newOptimisticUpdates = new Map(prev);
        newOptimisticUpdates.set(id, updates);
        return newOptimisticUpdates;
      });
    },
    []
  );

  const clearOptimisticUpdate = React.useCallback((id: string) => {
    setOptimisticUpdates(prev => {
      const newOptimisticUpdates = new Map(prev);
      newOptimisticUpdates.delete(id);
      return newOptimisticUpdates;
    });
  }, []);

  const setPendingOperation = React.useCallback(
    (id: string, pending: boolean) => {
      setPendingOperations(prev => {
        const newPendingOperations = new Set(prev);
        if (pending) {
          newPendingOperations.add(id);
        } else {
          newPendingOperations.delete(id);
        }
        return newPendingOperations;
      });
    },
    []
  );

  return {
    optimisticUpdates,
    pendingOperations,
    setOptimisticUpdate,
    clearOptimisticUpdate,
    setPendingOperation,
  };
}
