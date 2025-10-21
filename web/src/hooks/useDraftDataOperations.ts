import * as React from 'react';

import type { Draft } from '@/types/admin';

export function useDraftDataOperations() {
  const [data, setData] = React.useState<Draft[]>([]);

  const updateDraft = React.useCallback(
    (id: string, updates: Partial<Draft>) => {
      setData(prev =>
        prev.map(draft => (draft.id === id ? { ...draft, ...updates } : draft))
      );
    },
    []
  );

  const removeDraft = React.useCallback((id: string) => {
    setData(prev => prev.filter(draft => draft.id !== id));
  }, []);

  const addDraft = React.useCallback((draft: Draft) => {
    setData(prev => [...prev, draft]);
  }, []);

  return {
    data,
    setData,
    updateDraft,
    removeDraft,
    addDraft,
  };
}
