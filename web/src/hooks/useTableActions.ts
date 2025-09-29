import { useCallback } from 'react';

interface UseTableActionsProps {
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
  onReload?: () => void;
  selectedCount?: number;
  status?: string;
}

export function useTableActions({
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onReload,
  selectedCount = 0,
  status,
}: UseTableActionsProps) {
  const isProcessing = false;

  const getDraftActions = useCallback(() => {
    if (status === 'approved') {
      return {
        primary: {
          label: `Добавить в каталог (${selectedCount})`,
          onClick: onConvertToCatalog,
          disabled: !selectedCount,
          loading: false,
          variant: 'success' as const,
        },
      };
    }

    if (status === 'draft') {
      return {
        primary: {
          label: `Одобрить (${selectedCount})`,
          onClick: onApprove,
          disabled: !selectedCount,
          loading: false,
          variant: 'primary' as const,
        },
      };
    }

    if (status === 'deleted') {
      return {
        primary: {
          label: `Восстановить (${selectedCount})`,
          onClick: onBulkRestore,
          disabled: !selectedCount,
          loading: false,
          variant: 'success' as const,
        },
        secondary: {
          label: `Удалить навсегда (${selectedCount})`,
          onClick: onBulkPermanentDelete,
          disabled: !selectedCount,
          loading: false,
          variant: 'danger' as const,
        },
      };
    }

    return {};
  }, [
    status,
    selectedCount,
    onApprove,
    onConvertToCatalog,
    onBulkRestore,
    onBulkPermanentDelete,
  ]);

  const getDeleteAction = useCallback(() => {
    if (status === 'deleted') return null;

    return {
      label: `Удалить (${selectedCount})`,
      onClick: onBulkDelete,
      disabled: !selectedCount,
      variant: 'danger' as const,
    };
  }, [status, selectedCount, onBulkDelete]);

  const getRefreshAction = useCallback(
    () => ({
      onClick: onReload,
      variant: 'secondary' as const,
    }),
    [onReload]
  );

  return {
    getDraftActions,
    getDeleteAction,
    getRefreshAction,
    isProcessing,
  };
}
