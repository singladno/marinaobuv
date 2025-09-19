import * as React from 'react';

import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftSelection(
  data: Draft[],
  selected: Record<string, boolean>,
  onToggle: (id: string) => void
) {
  const [localData, setLocalData] = React.useState<DraftWithSelected[]>(() =>
    data.map(d => ({ ...d, selected: !!selected[d.id] }))
  );

  React.useEffect(() => {
    const newData = data.map(d => ({ ...d, selected: !!selected[d.id] }));
    setLocalData(newData);
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

  return {
    localData,
    setLocalData,
    handleSelectionToggle,
  };
}
