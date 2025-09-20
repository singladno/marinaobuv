import * as React from 'react';

import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftSelection(
  data: Draft[],
  selected: Record<string, boolean>,
  onToggle: (id: string) => void,
  onSelectAll?: (selectAll: boolean) => void
) {
  const [localData, setLocalData] = React.useState<DraftWithSelected[]>(() =>
    data.map(d => ({ ...d, selected: !!selected[d.id] }))
  );

  // Only sync with external data changes, don't override local optimistic updates
  React.useEffect(() => {
    const newData = data.map(d => ({ ...d, selected: !!selected[d.id] }));
    setLocalData(prev => {
      // If this is the initial load (no previous data), use new data
      if (prev.length === 0) {
        return newData;
      }

      // For subsequent updates, only update if the data has actually changed
      // This prevents overriding optimistic updates
      const dataChanged =
        data.length !== prev.length ||
        data.some((newItem, index) => {
          const prevItem = prev[index];
          return !prevItem || prevItem.id !== newItem.id;
        });

      if (dataChanged) {
        return newData;
      } else {
        // No data change, keep local state to preserve optimistic updates
        return prev;
      }
    });
  }, [data, selected]);

  // Optimized selection toggle that only updates the specific item
  const handleSelectionToggle = React.useCallback(
    (id: string) => {
      setLocalData(prev =>
        prev.map(item =>
          item.id === id ? { ...item, selected: !item.selected } : item
        )
      );
      onToggle(id);
    },
    [onToggle]
  );

  // Select all functionality
  const handleSelectAll = React.useCallback(
    (selectAll: boolean) => {
      setLocalData(prev =>
        prev.map(item => ({ ...item, selected: selectAll }))
      );
      if (onSelectAll) {
        onSelectAll(selectAll);
      }
    },
    [onSelectAll]
  );

  // Check if all items are selected
  const allSelected =
    localData.length > 0 && localData.every(item => item.selected);
  const someSelected = localData.some(item => item.selected);

  return {
    localData,
    setLocalData,
    handleSelectionToggle,
    handleSelectAll,
    allSelected,
    someSelected,
  };
}
