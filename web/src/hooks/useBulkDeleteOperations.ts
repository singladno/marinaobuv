import * as React from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';

export function useBulkDeleteOperations() {
  const { addNotification } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] =
    React.useState(false);

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
        onClearSelection(); // Always clear selection regardless of success/failure
      }
    },
    [addNotification]
  );

  return {
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
  };
}
