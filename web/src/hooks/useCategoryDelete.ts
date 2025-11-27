import * as React from 'react';

import type { AdminCategoryNode, FlatAdminCategory } from '@/types/category';

export function useCategoryDelete(
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
  reload: () => Promise<void>
) {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<
    AdminCategoryNode | FlatAdminCategory | null
  >(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = React.useCallback(
    (category: AdminCategoryNode | FlatAdminCategory) => {
      setCategoryToDelete(category);
      setDeleteModalOpen(true);
    },
    []
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/categories/${categoryToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error || 'Не удалось удалить категорию');
      }

      if (selectedId === categoryToDelete.id) {
        setSelectedId(null);
      }

      await reload();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(
        error instanceof Error ? error.message : 'Не удалось удалить категорию'
      );
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, selectedId, setSelectedId, reload]);

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  }, []);

  return {
    deleteModalOpen,
    categoryToDelete,
    isDeleting,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}
