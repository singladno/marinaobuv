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

  React.useEffect(() => {
    const newData = data.map(d => ({ ...d, selected: !!selected[d.id] }));
    setLocalData(prev => {
      // Keep optimistically deleted items out of the new data
      const prevIds = new Set(prev.map(item => item.id));
      const newIds = new Set(newData.map(item => item.id));

      // If new data has items that weren't in previous data, it's a fresh load
      // If previous data has items not in new data, they were optimistically deleted
      const hasNewItems = newData.some(item => !prevIds.has(item.id));
      const hasDeletedItems = prev.some(item => !newIds.has(item.id));

      if (hasNewItems && !hasDeletedItems) {
        // Fresh data load - use new data
        return newData;
      } else {
        // Merge: keep optimistically deleted items out, add new items, update existing
        const merged = new Map();

        // Add all new data items
        newData.forEach(item => merged.set(item.id, item));

        // Add back items that were optimistically deleted (they should stay deleted)
        prev.forEach(item => {
          if (!newIds.has(item.id)) {
            // This item was optimistically deleted, keep it out
            return;
          }
        });

        return Array.from(merged.values());
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
