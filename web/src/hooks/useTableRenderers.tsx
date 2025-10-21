import { useCallback } from 'react';

import {
  ActionButtonGroup,
  BulkActionButton,
  RefreshButton,
} from '@/components/ui/ActionButtons';
import {
  FilterBar,
  SearchFilter,
  FilterActions,
} from '@/components/ui/FilterBar';

import { useTableActions } from './useTableActions';

interface UseTableRenderersProps {
  isDraftTable?: boolean;
  isProductTable?: boolean;
  status?: string;
  selectedCount?: number;
  filters?: {
    search: string;
    categoryId: string;
  };
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
  onReload?: () => void;
  onFiltersChange?: (filters: { search?: string; categoryId?: string }) => void;
}

export function useTableRenderers({
  isDraftTable = false,
  isProductTable = false,
  status,
  selectedCount,
  filters,
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onReload,
  onFiltersChange,
}: UseTableRenderersProps) {
  const tableActions = useTableActions({
    onApprove,
    onConvertToCatalog,
    onBulkDelete,
    onBulkRestore,
    onBulkPermanentDelete,
    onReload,
    selectedCount,
    status,
  });

  const renderDraftActions = useCallback(() => {
    if (!isDraftTable) return null;

    const draftActions = tableActions.getDraftActions();
    const deleteAction = tableActions.getDeleteAction();
    const refreshAction = tableActions.getRefreshAction();

    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <ActionButtonGroup>
          {draftActions.primary && (
            <BulkActionButton
              count={selectedCount ?? 0}
              onClick={draftActions.primary.onClick}
              disabled={draftActions.primary.disabled}
              loading={draftActions.primary.loading}
              variant={draftActions.primary.variant}
            >
              {draftActions.primary.label}
            </BulkActionButton>
          )}
          {draftActions.secondary && (
            <BulkActionButton
              count={selectedCount ?? 0}
              onClick={draftActions.secondary.onClick}
              disabled={draftActions.secondary.disabled}
              variant={draftActions.secondary.variant}
            >
              {draftActions.secondary.label}
            </BulkActionButton>
          )}
          {deleteAction && (
            <BulkActionButton
              count={selectedCount ?? 0}
              onClick={deleteAction.onClick}
              disabled={deleteAction.disabled}
              variant={deleteAction.variant}
            >
              {deleteAction.label}
            </BulkActionButton>
          )}
        </ActionButtonGroup>

        <FilterActions>
          <RefreshButton {...refreshAction} />
        </FilterActions>
      </div>
    );
  }, [isDraftTable, tableActions, selectedCount]);

  const renderProductFilters = useCallback(() => {
    if (!isProductTable || !filters || !onFiltersChange) return null;

    return (
      <FilterBar>
        <SearchFilter
          value={filters.search}
          onChange={value => onFiltersChange({ search: value })}
          placeholder="Поиск товаров..."
        />
        <FilterActions>
          <RefreshButton onClick={onReload} />
        </FilterActions>
      </FilterBar>
    );
  }, [isProductTable, filters, onFiltersChange, onReload]);

  return {
    renderDraftActions,
    renderProductFilters,
  };
}
