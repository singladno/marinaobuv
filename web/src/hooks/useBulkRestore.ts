import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';

export function useBulkRestore() {
  const { addNotification } = useNotifications();
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleBulkRestoreConfirm = React.useCallback(
    async (
      selectedIds: string[],
      onReload: () => Promise<void>,
      onClearSelection: () => void
    ) => {
      try {
        setIsRestoring(true);

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

        addNotification({
          type: 'success',
          title: 'Успешно восстановлено',
          message: `Восстановлено ${selectedIds.length} черновиков`,
        });

        await onReload();
      } finally {
        setIsRestoring(false);
        setShowRestoreModal(false);
        onClearSelection();
      }
    },
    [addNotification]
  );

  return {
    showRestoreModal,
    setShowRestoreModal,
    isRestoring,
    handleBulkRestoreConfirm,
  };
}
