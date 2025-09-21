import * as React from 'react';
import { useNotifications } from '@/components/ui/NotificationProvider';

export function useDraftBulkOperations() {
  const { addNotification } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] =
    React.useState(false);
  const [isRunningAI, setIsRunningAI] = React.useState(false);

  const approve = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      try {
        const res = await fetch(`/api/admin/drafts/approve`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при одобрении',
            message: errorText,
          });
          return;
        }

        addNotification({
          type: 'success',
          title: 'Успешно одобрено',
          message: `Одобрено ${selectedIds.length} черновиков`,
        });

        await onReload();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка при одобрении',
          message: 'Произошла неожиданная ошибка',
        });
      } finally {
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  const convertToCatalog = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      try {
        const res = await fetch(`/api/admin/drafts/convert-to-catalog`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при добавлении в каталог',
            message: errorText,
          });
          return;
        }

        addNotification({
          type: 'success',
          title: 'Успешно добавлено в каталог',
          message: `Добавлено ${selectedIds.length} товаров в каталог`,
        });

        await onReload();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка при добавлении в каталог',
          message: 'Произошла неожиданная ошибка',
        });
      } finally {
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  const handleBulkDeleteConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      setIsDeleting(true);

      try {
        const res = await fetch(`/api/admin/drafts/bulk-delete`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при удалении',
            message: errorText,
          });
          return;
        }

        const result = await res.json();
        addNotification({
          type: 'success',
          title: 'Успешно удалено',
          message: `Удалено ${result.count} черновиков`,
        });

        await onReload();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка при удалении',
          message: 'Произошла неожиданная ошибка',
        });
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  const handleBulkRestoreConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      setIsRestoring(true);

      try {
        const res = await fetch(`/api/admin/drafts/bulk-restore`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при восстановлении',
            message: errorText,
          });
          return;
        }

        const result = await res.json();
        addNotification({
          type: 'success',
          title: 'Успешно восстановлено',
          message: `Восстановлено ${result.count} черновиков`,
        });

        await onReload();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка при восстановлении',
          message: 'Произошла неожиданная ошибка',
        });
      } finally {
        setIsRestoring(false);
        setShowRestoreModal(false);
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  const handleBulkPermanentDeleteConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      setIsPermanentlyDeleting(true);

      try {
        const res = await fetch(`/api/admin/drafts/bulk-permanent-delete`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-role': 'ADMIN' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          addNotification({
            type: 'error',
            title: 'Ошибка при удалении навсегда',
            message: errorText,
          });
          return;
        }

        const result = await res.json();
        addNotification({
          type: 'success',
          title: 'Успешно удалено навсегда',
          message: `Удалено навсегда ${result.count} черновиков`,
        });

        await onReload();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Ошибка при удалении навсегда',
          message: 'Произошла неожиданная ошибка',
        });
      } finally {
        setIsPermanentlyDeleting(false);
        setShowPermanentDeleteModal(false);
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  const runAIAnalysis = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onRefetchAIStatus: () => Promise<void>
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
          return;
        }

        addNotification({
          type: 'success',
          title: 'AI анализ запущен',
          message: `Запущен анализ ${selectedIds.length} товаров`,
        });

        // Reload data to show updated AI status immediately
        await onReload();

        // Wait a moment for the database to be updated, then refetch AI status
        setTimeout(async () => {
          await onRefetchAIStatus();
          setIsRunningAI(false);
        }, 500);
      } catch (error) {
        setIsRunningAI(false);
        addNotification({
          type: 'error',
          title: 'Ошибка при запуске AI анализа',
          message: 'Произошла неожиданная ошибка',
        });
      }
    },
    [addNotification]
  );

  return {
    // State
    showDeleteModal,
    setShowDeleteModal,
    showRestoreModal,
    setShowRestoreModal,
    showPermanentDeleteModal,
    setShowPermanentDeleteModal,
    isDeleting,
    isRestoring,
    isPermanentlyDeleting,
    isRunningAI,

    // Actions
    approve,
    convertToCatalog,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
    runAIAnalysis,
  };
}
