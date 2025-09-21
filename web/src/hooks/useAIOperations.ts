import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useAIEventsConnection } from '@/hooks/useAIEventsConnection';

export function useAIOperations() {
  const { addNotification } = useNotifications();
  const { aiState } = useAIEventsConnection();
  const [isRunningAI, setIsRunningAI] = React.useState(false);

  // Sync isRunningAI with AI events
  React.useEffect(() => {
    if (aiState.status === 'completed' || aiState.status === 'failed') {
      setIsRunningAI(false);
    }
  }, [aiState.status]);

  // Store the onClearSelection callback for AI completion
  const onClearSelectionRef = React.useRef<(() => void) | undefined>();
  React.useEffect(() => {
    if (aiState.status === 'completed' && onClearSelectionRef.current) {
      onClearSelectionRef.current();
      onClearSelectionRef.current = undefined;
    }
  }, [aiState.status]);

  const runAIAnalysis = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onRefetchAIStatus: () => Promise<void>,
      status?: string,
      onClearSelection?: () => void
    ) => {
      try {
        if (selectedIds.length === 0) {
          addNotification({
            type: 'warning',
            title: 'Нет выбранных товаров',
            message: 'Выберите товары для запуска AI анализа',
          });
          return;
        }

        setIsRunningAI(true);
        onClearSelectionRef.current = onClearSelection;

        const res = await fetch(`/api/admin/drafts/run-ai-analysis`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ draftIds: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при запуске AI анализа',
            message: errorText,
          });
          setIsRunningAI(false);
          onClearSelectionRef.current = undefined;
          return;
        }

        addNotification({
          type: 'success',
          title: 'AI анализ запущен',
          message: `Запущен анализ ${selectedIds.length} товаров`,
        });

        // Reload data to show updated AI status immediately
        await onReload();

        // AI events will handle the completion via WebSocket
        // No need for polling anymore
      } catch (error) {
        setIsRunningAI(false);
        if (onClearSelection) {
          onClearSelection();
        }
        addNotification({
          type: 'error',
          title: 'Ошибка при запуске AI анализа',
          message: 'Произошла неожиданная ошибка',
        });
      }
    },
    [addNotification]
  );

  const cancelAIAnalysis = async () => {
    try {
      const res = await fetch('/api/admin/drafts/cancel-ai-analysis', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
      });

      if (!res.ok) {
        const errorText = await res.text();
        addNotification({
          type: 'error',
          title: 'Ошибка при отмене AI анализа',
          message: errorText,
        });
        return;
      }

      setIsRunningAI(false);
      onClearSelectionRef.current = undefined;

      addNotification({
        type: 'success',
        title: 'AI анализ отменен',
        message: 'AI анализ был успешно отменен',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка при отмене AI анализа',
        message: 'Произошла неожиданная ошибка',
      });
    }
  };

  return {
    isRunningAI,
    runAIAnalysis,
    cancelAIAnalysis,
  };
}
