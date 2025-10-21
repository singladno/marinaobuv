import { useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCategoryLookupContext } from '@/contexts/CategoryLookupContext';
import type { ProductUpdateData } from '@/types/product';

interface UseProductHandlersParams {
  updateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  onBulkDelete: () => Promise<boolean>;
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
  const { refreshCategories } = useCategoryLookupContext();

  const handleUpdateProduct = useCallback(
    async (id: string, data: ProductUpdateData) => {
      try {
        const payload = { id, ...data };

        // Call the API directly to get proper error handling
        const response = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }

        const result = await response.json();

        // Update the product in the local state with the server response
        // Filter out relationship fields that cannot be updated
        const { category, images, _count, ...updateableFields } =
          result.product;
        await updateProduct(id, updateableFields);

        // Refresh categories if categoryId was updated
        if (data.categoryId) {
          await refreshCategories();
        }

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
        // Use optimistic operations pipeline (will call API once under the hood)
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
      const success = await onBulkDelete();
      if (success) {
        addNotification({
          type: 'success',
          title: 'Товары удалены',
          message: `${selectedCount} товаров успешно удалено.`,
        });
      }
      // If success is false, user cancelled - no notification needed
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
