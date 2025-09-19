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

// Custom hook for persistent column visibility
function usePersistentColumnVisibility(
  storageKey: string,
  defaultVisibility: VisibilityState
) {
  const STORAGE_VERSION = '1.0';

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
              console.log('Migrating column visibility from old format');
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
  const {
    localData,
    setLocalData,
    handleSelectionToggle,
    handleSelectAll,
    allSelected,
    someSelected,
  } = useDraftSelection(data, selected, onToggle, onSelectAll);

  const defaultColumnVisibility: VisibilityState = {
    category: false, // Hide category column
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
      someSelected,
      status
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
    status,
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
    resetColumnVisibility();
  }, [resetColumnVisibility]);

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
