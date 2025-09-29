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
  getApprovalState?: (id: string) => { isProcessing: boolean };
}

export function createOptimisticDraftTableColumns(
  options: CreateColumnsOptions
) {
  return createColumns({
    onPatch: options.onPatch,
    onDelete: options.onDelete,
    onImageToggle: options.onImageToggle,
    categories: options.categories,
    onReload: options.onReload,
    status: options.status,
    onToggle: options.onToggle,
    getApprovalState: options.getApprovalState,
  } as any);
}
