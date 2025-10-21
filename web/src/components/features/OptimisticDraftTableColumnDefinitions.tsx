import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { createActionColumns } from './OptimisticDraftActionColumns';
import { createBasicColumns } from './OptimisticDraftBasicColumns';
import { createPriceColumns } from './OptimisticDraftPriceColumns';
import { createProductColumns } from './OptimisticDraftProductColumns';

interface CreateOptimisticDraftTableColumnsParams {
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  status?: string;
  onToggle?: (id: string) => void;
  getApprovalState?: (id: string) => { isProcessing: boolean };
}

export function createOptimisticDraftTableColumns({
  onPatch,
  onDelete,
  onImageToggle,
  categories,
  onReload,
  status,
  onToggle,
  getApprovalState,
}: CreateOptimisticDraftTableColumnsParams) {
  const basicColumns = createBasicColumns(
    categories,
    onToggle,
    getApprovalState
  );
  const productColumns = createProductColumns(onPatch);
  const priceColumns = createPriceColumns(onPatch);
  const actionColumns = createActionColumns(
    onPatch,
    onDelete,
    onImageToggle,
    onReload
  );

  return [
    ...basicColumns,
    ...productColumns,
    ...priceColumns,
    ...actionColumns,
  ];
}
