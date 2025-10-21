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
  getApprovalState,
}: {
  data: Draft[];
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: 'pending' | 'approved' | 'rejected' | 'deleted' | string;
  getApprovalState?: (id: string) => { isProcessing: boolean };
}) {
  const [localData, setLocalData] = React.useState<Draft[]>(data);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const { handleDelete, handlePatch } = useDraftOperations({
    data: localData,
    selected,
    onPatch,
    onDelete,
    setLocalData,
  });

  // TanStack Table row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Clear selection when status (tab) changes
  React.useEffect(() => {
    setRowSelection({});
  }, [status]);

  // Sync external data with internal state
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

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
    return createOptimisticDraftTableColumns({
      onPatch: handlePatch,
      onDelete: handleDelete,
      onImageToggle,
      categories,
      onReload,
      status,
      onToggle: toggleRowSelection,
      getApprovalState,
    });
  }, [
    handlePatch,
    handleDelete,
    onImageToggle,
    categories,
    onReload,
    status,
    toggleRowSelection,
    getApprovalState,
  ]);

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: finalColumnVisibility,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row: Draft) => row.id,
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
    savingStatus: 'idle', // Simplified for now
    selectedRows,
    selectedIds,
    allSelected,
    someSelected,
    dataWithOptimisticUpdates: localData,
    clearSelection,
  };
}
