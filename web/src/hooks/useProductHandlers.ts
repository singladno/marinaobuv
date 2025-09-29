import { useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';

interface UseProductHandlersParams {
  updateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkActivate: () => Promise<void>;
  onBulkDeactivate: () => Promise<void>;
  selectedCount: number;
}

export function useProductHandlers({
  updateProduct,
  deleteProduct,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  selectedCount,
}: UseProductHandlersParams) {
  const { addNotification } = useNotifications();

  const handleUpdateProduct = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        await updateProduct(id, data);
        addNotification({
          type: 'success',
          title: 'Товар обновлен',
          message: 'Товар успешно обновлен.',
        });
      } catch {
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message: 'Не удалось обновить товар.',
        });
      }
    },
    [updateProduct, addNotification]
  );

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      try {
        await deleteProduct(id);
        addNotification({
          type: 'success',
          title: 'Товар удален',
          message: 'Товар успешно удален.',
        });
      } catch {
        addNotification({
          type: 'error',
          title: 'Ошибка удаления',
          message: 'Не удалось удалить товар.',
        });
      }
    },
    [deleteProduct, addNotification]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      await onBulkDelete();
      addNotification({
        type: 'success',
        title: 'Товары удалены',
        message: `${selectedCount} товаров успешно удалено.`,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: 'Не удалось удалить товары.',
      });
    }
  }, [onBulkDelete, selectedCount, addNotification]);

  const handleBulkActivate = useCallback(async () => {
    try {
      await onBulkActivate();
      addNotification({
        type: 'success',
        title: 'Товары активированы',
        message: `${selectedCount} товаров успешно активировано.`,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Ошибка активации',
        message: 'Не удалось активировать товары.',
      });
    }
  }, [onBulkActivate, selectedCount, addNotification]);

  const handleBulkDeactivate = useCallback(async () => {
    try {
      await onBulkDeactivate();
      addNotification({
        type: 'success',
        title: 'Товары деактивированы',
        message: `${selectedCount} товаров успешно деактивировано.`,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Ошибка деактивации',
        message: 'Не удалось деактивировать товары.',
      });
    }
  }, [onBulkDeactivate, selectedCount, addNotification]);

  return {
    handleUpdateProduct,
    handleDeleteProduct,
    handleBulkDelete,
    handleBulkActivate,
    handleBulkDeactivate,
  };
}
