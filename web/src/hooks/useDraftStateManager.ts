import * as React from 'react';

import type { Draft } from '@/types/admin';

import { useDraftDataOperations } from './useDraftDataOperations';
import { useDraftOptimisticUpdates } from './useDraftOptimisticUpdates';
import { useDraftState } from './useDraftState';

export interface DraftState {
  data: Draft[];
  loading: boolean;
  error: string | null;
  optimisticUpdates: Map<string, Partial<Draft>>;
  pendingOperations: Set<string>;
}

export interface DraftStateActions {
  setData: (data: Draft[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  removeDraft: (id: string) => void;
  addDraft: (draft: Draft) => void;
  setOptimisticUpdate: (id: string, updates: Partial<Draft>) => void;
  clearOptimisticUpdate: (id: string) => void;
  setPendingOperation: (id: string, pending: boolean) => void;
  reset: () => void;
}

export function useDraftStateManager() {
  const state = useDraftState();
  const dataOps = useDraftDataOperations();
  const optimisticOps = useDraftOptimisticUpdates();

  const actions: DraftStateActions = React.useMemo(
    () => ({
      setData: state.setData,
      setLoading: state.setLoading,
      setError: state.setError,
      updateDraft: dataOps.updateDraft,
      removeDraft: dataOps.removeDraft,
      addDraft: dataOps.addDraft,
      setOptimisticUpdate: optimisticOps.setOptimisticUpdate,
      clearOptimisticUpdate: optimisticOps.clearOptimisticUpdate,
      setPendingOperation: optimisticOps.setPendingOperation,
      reset: state.reset,
    }),
    [state, dataOps, optimisticOps]
  );

  const currentState: DraftState = React.useMemo(
    () => ({
      data: dataOps.data,
      loading: state.state.loading,
      error: state.state.error,
      optimisticUpdates: optimisticOps.optimisticUpdates,
      pendingOperations: optimisticOps.pendingOperations,
    }),
    [
      dataOps.data,
      state.state.loading,
      state.state.error,
      optimisticOps.optimisticUpdates,
      optimisticOps.pendingOperations,
    ]
  );

  // Get draft with optimistic updates applied
  const getDraftWithOptimisticUpdates = React.useCallback(
    (draft: Draft): Draft => {
      const optimisticUpdate = optimisticOps.optimisticUpdates.get(draft.id);
      if (!optimisticUpdate) return draft;
      return { ...draft, ...optimisticUpdate };
    },
    [optimisticOps.optimisticUpdates]
  );

  // Get all drafts with optimistic updates applied
  const dataWithOptimisticUpdates = React.useMemo(
    () => dataOps.data.map(getDraftWithOptimisticUpdates),
    [dataOps.data, getDraftWithOptimisticUpdates]
  );

  return {
    state: currentState,
    actions,
    dataWithOptimisticUpdates,
    getDraftWithOptimisticUpdates,
  };
}
