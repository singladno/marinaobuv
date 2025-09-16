import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

import { createDraftTableColumns } from '@/components/features/DraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

type DraftWithSelected = Draft & { selected?: boolean };

export function useDraftsTable({
  data,
  selected,
  onToggle,
  onPatch,
  onDelete,
  categories,
}: {
  data: Draft[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: CategoryNode[];
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

  const columns = React.useMemo(
    () => createDraftTableColumns(onToggle, onPatch, handleDelete, categories),
    [onToggle, onPatch, handleDelete, categories]
  );

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
  };
}
