import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createDraftTableColumns } from '@/components/features/DraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useImageToggleWithUpdate } from './useImageToggleWithUpdate';

// Custom hook for persistent column visibility
function usePersistentColumnVisibility(
  storageKey: string,
  defaultVisibility: VisibilityState
) {
  const STORAGE_VERSION = '1.2';

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
  // Manage local data directly instead of using useDraftSelection
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

  const defaultColumnVisibility: VisibilityState = {
    article: true, // Always visible
    category: status === 'approved', // Show category column only for approved status
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

      // Optimistic update - immediately update local data
      setLocalData(prev => {
        previous = prev;
        const updated = prev.map(item =>
          item.id === id ? { ...item, ...patch } : item
        );
        return updated;
      });

      try {
        await onPatch(id, patch);

        // After successful patch, ensure the local data is still up to date
        // This handles cases where the server response might have additional changes
        setLocalData(prev => {
          const currentItem = prev.find(item => item.id === id);
          if (currentItem) {
            // Keep the optimistic update if it's still valid
            return prev;
          }
          // If item was removed, sync with external data
          return data.map(d => ({ ...d, selected: !!selected[d.id] }));
        });
      } catch (e) {
        console.error('Failed to patch draft', e);
        // Revert optimistic update on error
        setLocalData(previous);
        throw e;
      }
    },
    [onPatch, data, selected]
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

  // Create a key that changes when localData changes to force table re-render
  const tableKey = React.useMemo(() => {
    return localData
      .map(
        item =>
          `${item.id}-${JSON.stringify(item.sizes)}-${JSON.stringify(item.images)}`
      )
      .join('|');
  }, [localData]);

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: finalColumnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      onLocalPatch: (id: string, patch: Partial<Draft>) => {
        setLocalData(prev =>
          prev.map(d => (d.id === id ? { ...d, ...patch } : d))
        );
      },
    },
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

  // Expose a local patch helper to allow external SSE handlers to update a row without network/reload
  const applyLocalPatch = React.useCallback(
    (id: string, patch: Partial<Draft>) => {
      setLocalData(prev =>
        prev.map(d => (d.id === id ? { ...d, ...patch } : d))
      );
    },
    []
  );

  return {
    table,
    columnVisibility: finalColumnVisibility,
    handleToggleColumn,
    handleResetColumns,
    savingStatus,
    handleSelectAll,
    allSelected,
    someSelected,
    tableKey, // Add tableKey to force re-renders
    applyLocalPatch,
  };
}
