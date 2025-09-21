import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createOptimisticDraftTableColumns } from '@/components/features/OptimisticDraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useDraftColumnVisibility } from './useDraftColumnVisibility';
import { useDraftOperations } from './useDraftOperations';

export function useDraftsTableNew({
  data,
  onPatch,
  onDelete,
  onImageToggle,
  categories,
  onReload,
  status,
}: {
  data: Draft[];
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
}) {
  const {
    actions,
    dataWithOptimisticUpdates,
    updateDraft,
    deleteDraft,
    toggleImage,
    isProcessing,
  } = useDraftOperations({
    onPatch,
    onDelete,
    onImageToggle,
  });

  // TanStack Table row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Clear selection when status (tab) changes
  React.useEffect(() => {
    setRowSelection({});
  }, [status]);

  // Sync external data with internal state
  React.useEffect(() => {
    actions.setData(data);
  }, [data, actions]);

  const {
    columnVisibility: finalColumnVisibility,
    setColumnVisibility,
    handleToggleColumn,
    resetColumnVisibility,
  } = useDraftColumnVisibility(status);

  // Function to toggle individual row selection
  const toggleRowSelection = React.useCallback((id: string) => {
    setRowSelection(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const columns = React.useMemo(() => {
    return createOptimisticDraftTableColumns(
      updateDraft,
      deleteDraft,
      toggleImage,
      categories,
      onReload,
      status,
      toggleRowSelection
    );
  }, [
    updateDraft,
    deleteDraft,
    toggleImage,
    categories,
    onReload,
    status,
    toggleRowSelection,
  ]);

  const table = useReactTable({
    data: dataWithOptimisticUpdates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: finalColumnVisibility,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: row => row.id,
  });

  const handleResetColumns = React.useCallback(() => {
    resetColumnVisibility();
  }, [resetColumnVisibility]);

  // Get selected rows using TanStack Table methods
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map(row => row.id);
  const allSelected = table.getIsAllRowsSelected();
  const someSelected = table.getIsSomeRowsSelected();

  // Function to clear all selections
  const clearSelection = React.useCallback(() => {
    setRowSelection({});
  }, []);

  return {
    table,
    columnVisibility: finalColumnVisibility,
    handleToggleColumn,
    handleResetColumns,
    savingStatus: isProcessing ? 'saving' : 'idle',
    selectedRows,
    selectedIds,
    allSelected,
    someSelected,
    dataWithOptimisticUpdates,
    clearSelection,
  };
}
