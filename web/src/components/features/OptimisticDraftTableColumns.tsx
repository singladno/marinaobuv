import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { createOptimisticDraftTableColumns as createColumns } from './OptimisticDraftTableColumnDefinitions';

interface CreateColumnsOptions {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
  onToggle?: (id: string) => void;
  draftIds?: string[];
}

export function createOptimisticDraftTableColumns(
  options: CreateColumnsOptions
) {
  return createColumns(
    options.onPatch,
    options.onDelete,
    options.onImageToggle,
    options.categories,
    options.onReload,
    options.status,
    options.onToggle,
    options.draftIds
  );
}
