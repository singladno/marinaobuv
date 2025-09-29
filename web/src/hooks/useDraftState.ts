import * as React from 'react';

import type { Draft } from '@/types/admin';

export interface DraftState {
  data: Draft[];
  loading: boolean;
  error: string | null;
  optimisticUpdates: Map<string, Partial<Draft>>;
  pendingOperations: Set<string>;
}

const initialState: DraftState = {
  data: [],
  loading: false,
  error: null,
  optimisticUpdates: new Map(),
  pendingOperations: new Set(),
};

export function useDraftState() {
  const [state, setState] = React.useState<DraftState>(initialState);

  const setData = React.useCallback((data: Draft[]) => {
    setState(prev => {
      // Preserve optimistic updates when syncing external data
      const newData = data.map(externalDraft => {
        const optimisticUpdate = prev.optimisticUpdates.get(externalDraft.id);
        if (optimisticUpdate) {
          // Merge external data with optimistic updates
          return { ...externalDraft, ...optimisticUpdate };
        }
        return externalDraft;
      });

      // Clear optimistic updates that match the external data
      const newOptimisticUpdates = new Map(prev.optimisticUpdates);
      data.forEach(externalDraft => {
        const optimisticUpdate = prev.optimisticUpdates.get(externalDraft.id);
        if (optimisticUpdate) {
          // Check if the external data now matches the optimistic update
          // For image updates, check if the images match
          if (optimisticUpdate.images) {
            const externalImages = externalDraft.images || [];
            const optimisticImages = optimisticUpdate.images || [];
            if (
              JSON.stringify(externalImages) ===
              JSON.stringify(optimisticImages)
            ) {
              newOptimisticUpdates.delete(externalDraft.id);
            }
          } else {
            // For non-image updates, check if the external data matches
            const hasChanges = Object.keys(optimisticUpdate).some(key => {
              if (key === 'images') return false; // Already handled above
              return (
                JSON.stringify(externalDraft[key as keyof Draft]) !==
                JSON.stringify(optimisticUpdate[key as keyof Draft])
              );
            });
            if (!hasChanges) {
              newOptimisticUpdates.delete(externalDraft.id);
            }
          }
        }
      });

      return {
        ...prev,
        data: newData,
        optimisticUpdates: newOptimisticUpdates,
        error: null,
      };
    });
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = React.useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const reset = React.useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setData,
    setLoading,
    setError,
    reset,
  };
}
