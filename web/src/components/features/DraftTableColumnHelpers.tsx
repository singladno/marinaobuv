import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Draft } from '@/types/admin';
import {
  calculateTotalPairs,
  calculateBoxPrice,
} from '@/utils/sizeCalculations';

import { ApprovalSelectionCell } from './ApprovalSelectionCell';
import { CategoryCell } from './CategoryCell';
import { ImagesCell } from './DraftTableCells';
import { EditableCell } from './EditableCell';
import { EditablePriceCell } from './EditablePriceCell';
import { GenderSelectCell } from './GenderSelectCell';
import { GptRequestCell } from './GptRequestCell';
import { GptResponseCell } from './GptResponseCell';
import { PriceCell } from './PriceCell';
import { ProviderCell } from './ProviderCell';
import { SeasonSelectCell } from './SeasonSelectCell';
import { SizesCell } from './SizesCell';
import { SourceCell } from './SourceCell';

type DraftWithSelected = Draft & { selected?: boolean };

const columnHelper = createColumnHelper<DraftWithSelected>();

// Memoized cell components to prevent re-renders
export const MemoizedEditableCell = React.memo(EditableCell);
export const MemoizedEditablePriceCell = React.memo(EditablePriceCell);
export const MemoizedCategoryCell = React.memo(CategoryCell);
export const MemoizedProviderCell = React.memo(ProviderCell);
export const MemoizedSizesCell = React.memo(SizesCell);
export const MemoizedSourceCell = React.memo(SourceCell);
export const MemoizedGenderSelectCell = React.memo(GenderSelectCell);
export const MemoizedSeasonSelectCell = React.memo(SeasonSelectCell);

export { columnHelper };
