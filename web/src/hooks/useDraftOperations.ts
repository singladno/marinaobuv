import * as React from 'react';

import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftOperations({
  data,
  selected,
  onPatch,
  onDelete,
  setLocalData,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  setLocalData: React.Dispatch<React.SetStateAction<DraftWithSelected[]>>;
}) {
  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        // Optimistic UI: immediately remove from local state
        setLocalData(prev => prev.filter(item => item.id !== id));
        await onDelete(id);
      } catch (e) {
        console.error('Failed to delete draft', e);
        // Revert optimistic update on error
        setLocalData(data.map(d => ({ ...d, selected: !!selected[d.id] })));
      }
    },
    [data, selected, onDelete, setLocalData]
  );

  const handlePatch = React.useCallback(
    async (id: string, patch: Partial<Draft>) => {
      let previous: DraftWithSelected[] = [];

      // Optimistic update - immediately update local data
      setLocalData(prev => {
        previous = prev;
        const updated = prev.map(item =>
          item.id === id ? { ...item, ...patch } : item
        );
        return updated;
      });

      try {
        await onPatch(id, patch);

        // After successful patch, ensure the local data is still up to date
        // This handles cases where the server response might have additional changes
        setLocalData(prev => {
          const currentItem = prev.find(item => item.id === id);
          if (currentItem) {
            // Keep the optimistic update if it's still valid
            return prev;
          }
          // If item was removed, sync with external data
          return data.map(d => ({ ...d, selected: !!selected[d.id] }));
        });
      } catch (e) {
        console.error('Failed to patch draft', e);
        // Revert optimistic update on error
        setLocalData(previous);
        throw e;
      }
    },
    [onPatch, data, selected, setLocalData]
  );

  return {
    handleDelete,
    handlePatch,
  };
}
