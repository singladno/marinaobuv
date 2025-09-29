import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';

import { createAdditionalColumns } from './DraftTableAdditionalColumns';
import { createBasicColumns } from './DraftTableBasicColumns';
import { createPriceColumns } from './DraftTablePriceColumns';
import { createProductColumns } from './DraftTableProductColumns';
interface CreateDraftTableColumnsParams {
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onImageToggle: (imageId: string, isActive: boolean) => Promise<void>;
  categories: CategoryNode[];
  onReload?: () => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  status?: string;
}

export function createDraftTableColumns({
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
}: CreateDraftTableColumnsParams) {
  const isApproved = status === 'approved';

  // Create basic columns (select, name, article, category, provider, source)
  const basicColumns = createBasicColumns({
    onToggle,
    onPatch,
    categories,
    onSelectAll,
    allSelected,
    someSelected,
    status,
  });

  // Create price columns
  const priceColumns = createPriceColumns({ onPatch });

  // Create product columns (material, description, gender, season) - only for approved
  const productColumns = isApproved ? createProductColumns({ onPatch }) : [];

  // Create additional columns (sizes, AI status, images, GPT, dates, actions)
  const additionalColumns = createAdditionalColumns({
    onPatch,
    onImageToggle,
    onReload,
    status,
  });

  return [
    ...basicColumns,
    ...priceColumns,
    ...productColumns,
    ...additionalColumns,
  ];
}
