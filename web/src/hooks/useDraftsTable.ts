import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createDraftTableColumns } from '@/components/features/DraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { useImageToggle } from './useImageToggle';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftsTable({
  data,
  selected,
  onToggle,
  onPatch,
  onDelete,
  categories,
  onReload,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
}) {
  const [localData, setLocalData] = React.useState<DraftWithSelected[]>(() =>
    data.map(d => ({ ...d, selected: !!selected[d.id] }))
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      gptRequest: false,
      gptResponse: false,
      createdAt: false,
      updatedAt: false,
    });

  const { handleImageToggle, savingStatus } = useImageToggle();

  React.useEffect(() => {
    setLocalData(data.map(d => ({ ...d, selected: !!selected[d.id] })));
  }, [data, selected]);

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
    [data, selected, onDelete]
  );

  const handleImageToggleWithUpdate = React.useCallback(
    async (imageId: string, isActive: boolean) => {
      await handleImageToggle(imageId, isActive);

      // Update local data
      setLocalData(prev =>
        prev.map(draft => ({
          ...draft,
          images: draft.images.map(img =>
            img.id === imageId ? { ...img, isActive } : img
          ),
        }))
      );
    },
    [handleImageToggle]
  );

  const columns = React.useMemo(() => {
    const handlePatch = async (id: string, patch: Partial<Draft>) => {
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
    };

    return createDraftTableColumns(
      onToggle,
      handlePatch,
      handleDelete,
      handleImageToggleWithUpdate,
      categories,
      onReload
    );
  }, [
    onToggle,
    onPatch,
    handleDelete,
    handleImageToggleWithUpdate,
    categories,
    onReload,
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
  };
}
