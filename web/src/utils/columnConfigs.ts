import type { VisibilityState } from '@tanstack/react-table';

import type { ColumnConfig } from '@/components/features/ColumnSettingsModal';

import { createBasicColumns } from './columnConfigs/basicColumns';
import { createMetaColumns } from './columnConfigs/metaColumns';
import { createPriceColumns } from './columnConfigs/priceColumns';
import { createProductColumns } from './columnConfigs/productColumns';
import { createSourceColumns } from './columnConfigs/sourceColumns';

export function createColumnConfigs(
  columnVisibility: VisibilityState,
  status?: string
): ColumnConfig[] {
  const isApproved = status === 'approved';

  return [
    ...createBasicColumns(isApproved),
    ...createPriceColumns(),
    ...createProductColumns(isApproved),
    ...createSourceColumns(columnVisibility),
    ...createMetaColumns(columnVisibility),
  ];
}
