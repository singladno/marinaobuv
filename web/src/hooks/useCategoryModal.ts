import * as React from 'react';

import type { AdminCategoryNode } from '@/types/category';

export function useCategoryModal(
  setSelectedId: (id: string) => void,
  reload: () => Promise<void>
) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalParentId, setModalParentId] = React.useState<string | null>(null);
  const [editingCategory, setEditingCategory] =
    React.useState<AdminCategoryNode | null>(null);

  const handleCreateRoot = React.useCallback(() => {
    setModalParentId(null);
    setEditingCategory(null);
    setModalOpen(true);
  }, []);

  const handleCreateSubcategory = React.useCallback((parentId: string) => {
    setModalParentId(parentId);
    setEditingCategory(null);
    setModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((category: AdminCategoryNode) => {
    setEditingCategory(category);
    setModalParentId(category.parentId);
    setModalOpen(true);
  }, []);

  const handleModalSuccess = React.useCallback(
    (categoryId: string) => {
      setSelectedId(categoryId);
      reload();
      setModalOpen(false);
      setEditingCategory(null);
      setModalParentId(null);
    },
    [setSelectedId, reload]
  );

  const handleModalClose = React.useCallback(() => {
    setModalOpen(false);
    setEditingCategory(null);
    setModalParentId(null);
  }, []);

  return {
    modalOpen,
    modalParentId,
    editingCategory,
    handleCreateRoot,
    handleCreateSubcategory,
    handleEdit,
    handleModalSuccess,
    handleModalClose,
  };
}
