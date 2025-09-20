import * as React from 'react';
import type { Draft } from '@/types/admin';

export interface DraftState {
  data: Draft[];
  loading: boolean;
  error: string | null;
  selected: Record<string, boolean>;
  optimisticUpdates: Map<string, Partial<Draft>>;
  pendingOperations: Set<string>;
}

export interface DraftStateActions {
  setData: (data: Draft[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSelection: (id: string) => void;
  selectAll: (selectAll: boolean) => void;
  clearSelection: () => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  removeDraft: (id: string) => void;
  addDraft: (draft: Draft) => void;
  setOptimisticUpdate: (id: string, updates: Partial<Draft>) => void;
  clearOptimisticUpdate: (id: string) => void;
  setPendingOperation: (id: string, pending: boolean) => void;
  reset: () => void;
}

const initialState: DraftState = {
  data: [],
  loading: false,
  error: null,
  selected: {},
  optimisticUpdates: new Map(),
  pendingOperations: new Set(),
};

export function useDraftStateManager() {
  const [state, setState] = React.useState<DraftState>(initialState);

  const actions: DraftStateActions = React.useMemo(
    () => ({
      setData: (data: Draft[]) => {
        setState(prev => {
          // Preserve optimistic updates when syncing external data
          const newData = data.map(externalDraft => {
            const optimisticUpdate = prev.optimisticUpdates.get(
              externalDraft.id
            );
            if (optimisticUpdate) {
              // Merge external data with optimistic updates
              return { ...externalDraft, ...optimisticUpdate };
            }
            return externalDraft;
          });

          // Clear optimistic updates that match the external data
          const newOptimisticUpdates = new Map(prev.optimisticUpdates);
          data.forEach(externalDraft => {
            const optimisticUpdate = prev.optimisticUpdates.get(
              externalDraft.id
            );
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
      },

      setLoading: (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
      },

      setError: (error: string | null) => {
        setState(prev => ({ ...prev, error }));
      },

      toggleSelection: (id: string) => {
        setState(prev => ({
          ...prev,
          selected: {
            ...prev.selected,
            [id]: !prev.selected[id],
          },
        }));
      },

      selectAll: (selectAll: boolean) => {
        setState(prev => {
          const newSelected: Record<string, boolean> = {};
          if (selectAll) {
            prev.data.forEach(draft => {
              newSelected[draft.id] = true;
            });
          }
          return {
            ...prev,
            selected: newSelected,
          };
        });
      },

      clearSelection: () => {
        setState(prev => ({ ...prev, selected: {} }));
      },

      updateDraft: (id: string, updates: Partial<Draft>) => {
        setState(prev => ({
          ...prev,
          data: prev.data.map(draft =>
            draft.id === id ? { ...draft, ...updates } : draft
          ),
        }));
      },

      removeDraft: (id: string) => {
        setState(prev => ({
          ...prev,
          data: prev.data.filter(draft => draft.id !== id),
          selected: { ...prev.selected, [id]: false },
        }));
      },

      addDraft: (draft: Draft) => {
        setState(prev => ({
          ...prev,
          data: [...prev.data, draft],
        }));
      },

      setOptimisticUpdate: (id: string, updates: Partial<Draft>) => {
        setState(prev => {
          const newOptimisticUpdates = new Map(prev.optimisticUpdates);
          newOptimisticUpdates.set(id, updates);
          return {
            ...prev,
            optimisticUpdates: newOptimisticUpdates,
          };
        });
      },

      clearOptimisticUpdate: (id: string) => {
        setState(prev => {
          const newOptimisticUpdates = new Map(prev.optimisticUpdates);
          newOptimisticUpdates.delete(id);
          return {
            ...prev,
            optimisticUpdates: newOptimisticUpdates,
          };
        });
      },

      setPendingOperation: (id: string, pending: boolean) => {
        setState(prev => {
          const newPendingOperations = new Set(prev.pendingOperations);
          if (pending) {
            newPendingOperations.add(id);
          } else {
            newPendingOperations.delete(id);
          }
          return {
            ...prev,
            pendingOperations: newPendingOperations,
          };
        });
      },

      reset: () => {
        setState(initialState);
      },
    }),
    []
  );

  // Computed values
  const selectedIds = React.useMemo(
    () => Object.keys(state.selected).filter(id => state.selected[id]),
    [state.selected]
  );

  const allSelected = React.useMemo(
    () =>
      state.data.length > 0 &&
      state.data.every(draft => state.selected[draft.id]),
    [state.data, state.selected]
  );

  const someSelected = React.useMemo(
    () => state.data.some(draft => state.selected[draft.id]),
    [state.data, state.selected]
  );

  // Get draft with optimistic updates applied
  const getDraftWithOptimisticUpdates = React.useCallback(
    (draft: Draft): Draft => {
      const optimisticUpdate = state.optimisticUpdates.get(draft.id);
      if (!optimisticUpdate) return draft;
      return { ...draft, ...optimisticUpdate };
    },
    [state.optimisticUpdates]
  );

  // Get all drafts with optimistic updates applied
  const dataWithOptimisticUpdates = React.useMemo(
    () => state.data.map(getDraftWithOptimisticUpdates),
    [state.data, getDraftWithOptimisticUpdates]
  );

  return {
    state,
    actions,
    selectedIds,
    allSelected,
    someSelected,
    dataWithOptimisticUpdates,
    getDraftWithOptimisticUpdates,
  };
}
