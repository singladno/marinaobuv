import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useDraftTableState } from './useDraftTableState';
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

  // Use the decomposed table state management
  const { table, columnVisibility, setColumnVisibility } = useDraftTableState({
    data: localData,
    onToggle: handleSelectionToggle,
    onPatch: handlePatch,
    onDelete: handleDelete,
    onImageToggle: handleImageToggleWithUpdate,
    categories,
    onReload,
    onSelectAll: handleSelectAll,
    allSelected,
    someSelected,
    status,
  });

  // Create a key that changes when localData changes to force table re-render
  const tableKey = React.useMemo(() => {
    return localData
      .map(
        item =>
          `${item.id}-${JSON.stringify(item.sizes)}-${JSON.stringify(item.images)}`
      )
      .join('|');
  }, [localData]);

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
    // Reset to default visibility
    setColumnVisibility({
      select: true,
      name: true,
      article: true,
      category: status === 'approved',
      provider: true,
      source: true,
      pricePairRub: true,
      packPairs: true,
      priceBoxRub: true,
      providerDiscountRub: true,
      material: true,
      description: true,
      gender: true,
      season: true,
      sizes: true,
      aiStatus: true,
      images: true,
      gptRequest: false,
      gptResponse: false,
      gptRequest2: false,
      gptResponse2: false,
      createdAt: false,
      updatedAt: false,
      actions: true,
    });
  }, [setColumnVisibility, status]);

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
    columnVisibility,
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
