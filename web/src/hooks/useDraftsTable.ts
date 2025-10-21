import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useDraftColumnManagement } from './useDraftColumnManagement';
import { useDraftOperations } from './useDraftOperations';
import { useDraftSelection } from './useDraftSelection';
import { useDraftTableState } from './useDraftTableState';
import { useImageToggleWithUpdate } from './useImageToggleWithUpdate';

export function useDraftsTable({
  data,
  selected,
  onToggle,
  onSelectAll,
  onPatch,
  onDelete,
  categories,
  onReload,
  status,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
}) {
  const selection = useDraftSelection({
    data,
    selected,
    onToggle,
    onSelectAll,
    status,
  });

  const operations = useDraftOperations({
    data,
    selected,
    onPatch,
    onDelete,
    setLocalData: selection.setLocalData,
  });

  const { handleImageToggleWithUpdate, savingStatus } =
    useImageToggleWithUpdate({
      setLocalData: selection.setLocalData,
    });

  const columnManagement = useDraftColumnManagement(status);

  // Use the decomposed table state management
  const { table } = useDraftTableState({
    data: selection.localData,
    onToggle: selection.handleSelectionToggle,
    onPatch: operations.handlePatch,
    onDelete: operations.handleDelete,
    onImageToggle: handleImageToggleWithUpdate,
    categories,
    onReload,
    onSelectAll: selection.handleSelectAll,
    allSelected: selection.allSelected,
    someSelected: selection.someSelected,
    status,
  });

  // Create a key that changes when localData changes to force table re-render
  const tableKey = React.useMemo(() => {
    return selection.localData
      .map(
        item =>
          `${item.id}-${JSON.stringify(item.sizes)}-${JSON.stringify(item.images)}`
      )
      .join('|');
  }, [selection.localData]);

  // Expose a local patch helper to allow external SSE handlers to update a row without network/reload
  const applyLocalPatch = React.useCallback(
    (id: string, patch: Partial<Draft>) => {
      selection.setLocalData(prev =>
        prev.map(d => (d.id === id ? { ...d, ...patch } : d))
      );
    },
    [selection.setLocalData]
  );

  return {
    table,
    columnVisibility: columnManagement.columnVisibility,
    handleToggleColumn: columnManagement.handleToggleColumn,
    handleResetColumns: columnManagement.handleResetColumns,
    savingStatus,
    handleSelectAll: selection.handleSelectAll,
    allSelected: selection.allSelected,
    someSelected: selection.someSelected,
    tableKey,
    applyLocalPatch,
  };
}
