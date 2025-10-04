import { useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import type { ProductUpdateData } from '@/types/product';

interface UseProductHandlersParams {
  updateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
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
    async (id: string, data: ProductUpdateData) => {
      try {
        // Call the API directly to get proper error handling
        const response = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }

        const result = await response.json();

        // Update the product in the local state
        await updateProduct(id, data);

        addNotification({
          type: 'success',
          title: 'Товар обновлен',
          message: 'Товар успешно обновлен.',
        });
      } catch (error) {
        console.error('Error updating product:', error);
        addNotification({
          type: 'error',
          title: 'Ошибка обновления',
          message:
            error instanceof Error
              ? error.message
              : 'Не удалось обновить товар.',
        });
      }
    },
    [updateProduct, addNotification]
  );

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      try {
        // Call the API directly to get proper error handling
        const response = await fetch('/api/admin/products', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete product');
        }

        // Update the product in the local state
        await deleteProduct(id);

        addNotification({
          type: 'success',
          title: 'Товар удален',
          message: 'Товар успешно удален.',
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        addNotification({
          type: 'error',
          title: 'Ошибка удаления',
          message:
            error instanceof Error
              ? error.message
              : 'Не удалось удалить товар.',
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
