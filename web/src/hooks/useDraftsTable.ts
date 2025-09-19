import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createDraftTableColumns } from '@/components/features/DraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useDraftSelection } from './useDraftSelection';
import { useImageToggleWithUpdate } from './useImageToggleWithUpdate';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftsTable({
  data,
  selected,
  onToggle,
  onSelectAll,
  onPatch,
  onDelete,
  categories,
  onReload,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
}) {
  const {
    localData,
    setLocalData,
    handleSelectionToggle,
    handleSelectAll,
    allSelected,
    someSelected,
  } = useDraftSelection(data, selected, onToggle, onSelectAll);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      category: false, // Hide category column
      gptRequest: false,
      gptResponse: false,
      createdAt: false,
      updatedAt: false,
    });

  const { handleImageToggleWithUpdate, savingStatus } =
    useImageToggleWithUpdate({
      setLocalData,
    });

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
      setLocalData(prev => {
        previous = prev;
        return prev.map(item =>
          item.id === id ? { ...item, ...patch } : item
        );
      });
      try {
        await onPatch(id, patch);
      } catch (e) {
        console.error('Failed to patch draft', e);
        setLocalData(previous);
        throw e;
      }
    },
    [onPatch, setLocalData]
  );

  const columns = React.useMemo(() => {
    return createDraftTableColumns(
      handleSelectionToggle,
      handlePatch,
      handleDelete,
      handleImageToggleWithUpdate,
      categories,
      onReload,
      handleSelectAll,
      allSelected,
      someSelected
    );
  }, [
    handleSelectionToggle,
    handlePatch,
    handleDelete,
    handleImageToggleWithUpdate,
    categories,
    onReload,
    handleSelectAll,
    allSelected,
    someSelected,
  ]);

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const handleToggleColumn = React.useCallback((columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  const handleResetColumns = React.useCallback(() => {
    setColumnVisibility({
      category: false, // Keep category column hidden
      gptRequest: false,
      gptResponse: false,
      createdAt: false,
      updatedAt: false,
    });
  }, []);

  return {
    table,
    columnVisibility,
    handleToggleColumn,
    handleResetColumns,
    savingStatus,
    handleSelectAll,
    allSelected,
    someSelected,
  };
}
