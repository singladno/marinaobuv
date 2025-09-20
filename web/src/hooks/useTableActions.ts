import { useCallback } from 'react';

interface UseTableActionsProps {
  onApprove?: () => void;
  onConvertToCatalog?: () => void;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onBulkPermanentDelete?: () => void;
  onRunAIScript?: () => void;
  onReload?: () => void;
  selectedCount?: number;
  status?: string;
  isRunningAI?: boolean;
  currentProcessingDraft?: {
    id: string;
    name: string | null;
    aiStatus: string | null;
    aiProcessedAt: string | null;
    updatedAt: string;
  } | null;
}

export function useTableActions({
  onApprove,
  onConvertToCatalog,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onRunAIScript,
  onReload,
  selectedCount = 0,
  status,
  isRunningAI = false,
  currentProcessingDraft,
}: UseTableActionsProps) {
  const isProcessing =
    isRunningAI ||
    (currentProcessingDraft &&
      currentProcessingDraft.aiStatus === 'ai_processing');

  const getDraftActions = useCallback(() => {
    if (status === 'approved') {
      return {
        primary: {
          label: isProcessing
            ? `Обрабатывается: ${currentProcessingDraft?.name || 'AI анализ запущен...'}`
            : `🤖 Запустить AI анализ (${selectedCount})`,
          onClick: onRunAIScript,
          disabled: !selectedCount || isProcessing,
          loading: isProcessing,
          variant: 'warning' as const,
        },
        secondary: {
          label: `Добавить в каталог (${selectedCount})`,
          onClick: onConvertToCatalog,
          disabled: !selectedCount,
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
          variant: 'success' as const,
        },
        secondary: {
          label: `Удалить навсегда (${selectedCount})`,
          onClick: onBulkPermanentDelete,
          disabled: !selectedCount,
          variant: 'danger' as const,
        },
      };
    }

    return {};
  }, [
    status,
    selectedCount,
    isProcessing,
    currentProcessingDraft,
    onApprove,
    onConvertToCatalog,
    onBulkRestore,
    onBulkPermanentDelete,
    onRunAIScript,
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
