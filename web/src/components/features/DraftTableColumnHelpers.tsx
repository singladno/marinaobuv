import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import type { Draft } from '@/types/admin';

import { CategoryCell } from './CategoryCell';
import { EditableCell } from './EditableCell';
import { EditablePriceCell } from './EditablePriceCell';
import { GenderSelectCell } from './GenderSelectCell';
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
