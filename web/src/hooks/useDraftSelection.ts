import * as React from 'react';

import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftSelection({
  data,
  selected,
  onToggle,
  onSelectAll,
  status,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  status?: string;
}) {
  const [localData, setLocalData] = React.useState<DraftWithSelected[]>(() =>
    data.map(d => ({ ...d, selected: !!selected[d.id] }))
  );

  // Clear selection when status (tab) changes
  React.useEffect(() => {
    setLocalData(prev => prev.map(item => ({ ...item, selected: false })));
  }, [status]);

  // Sync with external data changes, but preserve local optimistic updates
  React.useEffect(() => {
    setLocalData(prev => {
      const newData = data.map(d => ({ ...d, selected: !!selected[d.id] }));

      // Only update if the data has actually changed (by comparing IDs and key fields)
      const hasSignificantChanges =
        prev.length !== newData.length ||
        prev.some((prevItem, index) => {
          const newItem = newData[index];
          if (!newItem || prevItem.id !== newItem.id) return true;

          // Check if key fields have changed (excluding sizes and images which are handled optimistically)
          return (
            prevItem.name !== newItem.name ||
            prevItem.pricePair !== newItem.pricePair ||
            prevItem.packPairs !== newItem.packPairs ||
            prevItem.providerDiscount !== newItem.providerDiscount ||
            prevItem.material !== newItem.material ||
            prevItem.gender !== newItem.gender ||
            prevItem.season !== newItem.season ||
            prevItem.categoryId !== newItem.categoryId ||
            prevItem.aiStatus !== newItem.aiStatus ||
            prevItem.aiProcessedAt !== newItem.aiProcessedAt
          );
        });

      return hasSignificantChanges ? newData : prev;
    });
  }, [data, selected]);

  // Selection management
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
