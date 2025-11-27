'use client';

import * as React from 'react';

import { useAdminCategories } from '@/hooks/useAdminCategories';
import { useCategoryDelete } from '@/hooks/useCategoryDelete';
import { useCategoryModal } from '@/hooks/useCategoryModal';
import type { FlatAdminCategory } from '@/types/category';

import { CategoryTreePanel } from './CategoryTreePanel';
import { CategoryDetailsPanel } from './CategoryDetailsPanel';
import { CategoryModal } from './CategoryModal';
import { CategoryDeleteModal } from './CategoryDeleteModal';

export function AdminCategoriesPageContent() {
  const { tree, flat, loading, error, reload } = useAdminCategories();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const {
    deleteModalOpen,
    categoryToDelete,
    isDeleting,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useCategoryDelete(selectedId, setSelectedId, reload);

  const {
    modalOpen,
    modalParentId,
    editingCategory,
    handleCreateRoot,
    handleCreateSubcategory,
    handleEdit,
    handleModalSuccess,
    handleModalClose,
  } = useCategoryModal(setSelectedId, reload);

  React.useEffect(() => {
    if (loading || tree.length === 0) return;
    setSelectedId(prev => {
      if (prev && flat.some(item => item.id === prev)) return prev;
      return tree[0]?.id ?? null;
    });
  }, [loading, tree, flat]);

  const selected = React.useMemo<FlatAdminCategory | null>(() => {
    if (!selectedId) return null;
    return flat.find(item => item.id === selectedId) ?? null;
  }, [flat, selectedId]);

  // Flatten tree for parent selection (include all categories)
  const allParents = React.useMemo(() => {
    return flat.map(cat => ({
      ...cat,
      depth: cat.depth || 0,
    }));
  }, [flat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 lg:w-auto lg:min-w-[320px] lg:max-w-md">
          <CategoryTreePanel
            tree={tree}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
            onReload={reload}
            onCreateRoot={handleCreateRoot}
            onCreateSubcategory={handleCreateSubcategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <CategoryDetailsPanel
            category={selected}
            loading={loading}
            onReload={reload}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <CategoryModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        parents={allParents}
        parentId={modalParentId}
        category={editingCategory}
        onSuccess={handleModalSuccess}
      />

      <CategoryDeleteModal
        isOpen={deleteModalOpen}
        category={categoryToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
