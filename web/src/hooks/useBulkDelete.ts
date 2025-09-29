import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';

export function useBulkDelete() {
  const { addNotification } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleBulkDeleteConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      try {
        setIsDeleting(true);

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

        addNotification({
          type: 'success',
          title: 'Успешно удалено',
          message: `Удалено ${selectedIds.length} черновиков`,
        });

        await onReload();
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
        onClearSelection();
      }
    },
    [addNotification]
  );

  return {
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleBulkDeleteConfirm,
  };
}
