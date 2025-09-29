import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';

export function useBulkPermanentDelete() {
  const { addNotification } = useNotifications();
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = React.useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = React.useState(false);

  const handleBulkPermanentDeleteConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      try {
        setIsPermanentlyDeleting(true);

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

        addNotification({
          type: 'success',
          title: 'Успешно удалено навсегда',
          message: `Удалено навсегда ${selectedIds.length} черновиков`,
        });

        await onReload();
      } finally {
        setIsPermanentlyDeleting(false);
        setShowPermanentDeleteModal(false);
        onClearSelection();
      }
    },
    [addNotification]
  );

  return {
    showPermanentDeleteModal,
    setShowPermanentDeleteModal,
    isPermanentlyDeleting,
    handleBulkPermanentDeleteConfirm,
  };
}
