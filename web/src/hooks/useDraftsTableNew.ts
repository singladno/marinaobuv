import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createOptimisticDraftTableColumns } from '@/components/features/OptimisticDraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useDraftOperations } from './useDraftOperations';

// Custom hook for persistent column visibility
function usePersistentColumnVisibility(
  storageKey: string,
  defaultVisibility: VisibilityState
) {
  const STORAGE_VERSION = '1.3';

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      if (typeof window === 'undefined') {
        return defaultVisibility;
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);

          // Check if the saved data has the expected structure
          if (parsed && typeof parsed === 'object') {
            // If it's the old format (direct VisibilityState), migrate it
            if (!parsed.version) {
              return { ...defaultVisibility, ...parsed };
            }

            // If version matches, use the data
            if (parsed.version === STORAGE_VERSION && parsed.visibility) {
              return { ...defaultVisibility, ...parsed.visibility };
            }
          }
        }
      } catch (error) {
        console.warn(
          'Failed to load column visibility from localStorage:',
          error
        );
      }

      return defaultVisibility;
    });

  const updateColumnVisibility = React.useCallback(
    (
      newVisibility:
        | VisibilityState
        | ((prev: VisibilityState) => VisibilityState)
    ) => {
      setColumnVisibility(prev => {
        const updated =
          typeof newVisibility === 'function'
            ? newVisibility(prev)
            : newVisibility;

        // Save to localStorage with version
        if (typeof window !== 'undefined') {
          try {
            const dataToSave = {
              version: STORAGE_VERSION,
              visibility: updated,
              timestamp: Date.now(),
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
          } catch (error) {
            console.warn(
              'Failed to save column visibility to localStorage:',
              error
            );
          }
        }

        return updated;
      });
    },
    [storageKey]
  );

  const resetColumnVisibility = React.useCallback(() => {
    updateColumnVisibility(defaultVisibility);
  }, [updateColumnVisibility, defaultVisibility]);

  return {
    columnVisibility,
    setColumnVisibility: updateColumnVisibility,
    resetColumnVisibility,
  };
}

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
    state,
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

  // Sync external data with internal state
  React.useEffect(() => {
    actions.setData(data);
  }, [data]); // actions is stable from useDraftOperations

  const defaultColumnVisibility: VisibilityState = {
    article: true, // Always visible
    category: status === 'approved',
    gptRequest: false,
    gptResponse: false,
    gptRequest2: false,
    gptResponse2: false,
    createdAt: false,
    updatedAt: false,
  };

  const { columnVisibility, setColumnVisibility, resetColumnVisibility } =
    usePersistentColumnVisibility(
      `marinaobuv-drafts-table-columns-${status || 'draft'}`,
      defaultColumnVisibility
    );

  // Force category visibility for approved status
  const finalColumnVisibility = React.useMemo(() => {
    if (status === 'approved') {
      return { ...columnVisibility, category: true };
    }
    return columnVisibility;
  }, [columnVisibility, status]);

  const columns = React.useMemo(() => {
    return createOptimisticDraftTableColumns(
      updateDraft,
      deleteDraft,
      toggleImage,
      categories,
      onReload,
      status
    );
  }, [updateDraft, deleteDraft, toggleImage, categories, onReload, status]);

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

  const handleToggleColumn = React.useCallback(
    (columnId: string) => {
      setColumnVisibility(prev => {
        const newVisibility = {
          ...prev,
          [columnId]: !prev[columnId],
        };

        // For approved status, always keep category visible
        if (status === 'approved' && columnId === 'category') {
          newVisibility.category = true;
        }

        return newVisibility;
      });
    },
    [status, setColumnVisibility]
  );

  const handleResetColumns = React.useCallback(() => {
    resetColumnVisibility();
  }, [resetColumnVisibility]);

  // Get selected rows using TanStack Table methods
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map(row => row.id);
  const allSelected = table.getIsAllRowsSelected();
  const someSelected = table.getIsSomeRowsSelected();

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
  };
}
