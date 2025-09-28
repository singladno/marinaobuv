import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import * as React from 'react';

import { createDraftTableColumns } from '@/components/features/DraftTableColumns';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { usePersistentColumnVisibility } from './usePersistentColumnVisibility';

interface UseDraftTableStateParams {
  data: Draft[];
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  status?: string;
}

export function useDraftTableState({
  data,
  onToggle,
  onPatch,
  onDelete,
  onImageToggle,
  categories,
  onReload,
  onSelectAll,
  allSelected,
  someSelected,
  status,
}: UseDraftTableStateParams) {
  // Default column visibility
  const defaultColumnVisibility = React.useMemo(
    () => ({
      select: true,
      name: true,
      article: true,
      category: true,
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
    }),
    []
  );

  const [columnVisibility, setColumnVisibility] = usePersistentColumnVisibility(
    'draft-table-column-visibility',
    defaultColumnVisibility
  );

  // Create columns
  const columns = React.useMemo(
    () =>
      createDraftTableColumns({
        onToggle,
        onPatch,
        onDelete,
        onImageToggle,
        categories,
        onReload,
        onSelectAll,
        allSelected,
        someSelected,
        status,
      }),
    [
      onToggle,
      onPatch,
      onDelete,
      onImageToggle,
      categories,
      onReload,
      onSelectAll,
      allSelected,
      someSelected,
      status,
    ]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return {
    table,
    columnVisibility,
    setColumnVisibility,
  };
}
