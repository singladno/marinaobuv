import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useBulkDeleteOperations } from '@/hooks/useBulkDeleteOperations';

export function useDraftBulkOperations() {
  const { addNotification } = useNotifications();
  const {
    showDeleteModal,
    setShowDeleteModal,
    showRestoreModal,
    setShowRestoreModal,
    showPermanentDeleteModal,
    setShowPermanentDeleteModal,
    isDeleting,
    isRestoring,
    isPermanentlyDeleting,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
  } = useBulkDeleteOperations();

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
      } catch {
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
      } catch {
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
    // Actions
    approve,
    convertToCatalog,
    handleBulkDeleteConfirm,
    handleBulkRestoreConfirm,
    handleBulkPermanentDeleteConfirm,
  };
}
