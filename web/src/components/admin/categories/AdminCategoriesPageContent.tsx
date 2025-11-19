'use client';

import * as React from 'react';

import { useAdminCategories } from '@/hooks/useAdminCategories';
import type { FlatAdminCategory, AdminCategoryNode } from '@/types/category';

import { CategoryTreePanel } from './CategoryTreePanel';
import { CategoryDetailsPanel } from './CategoryDetailsPanel';
import { CategoryModal } from './CategoryModal';

export function AdminCategoriesPageContent() {
  const { tree, flat, loading, error, reload } = useAdminCategories();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalParentId, setModalParentId] = React.useState<string | null>(null);
  const [editingCategory, setEditingCategory] =
    React.useState<AdminCategoryNode | null>(null);

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

  const handleCreateRoot = () => {
    // Create at root level (parentId === null)
    setModalParentId(null);
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleCreateSubcategory = (parentId: string) => {
    setModalParentId(parentId);
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category: AdminCategoryNode) => {
    setEditingCategory(category);
    setModalParentId(category.parentId);
    setModalOpen(true);
  };

  const handleModalSuccess = (categoryId: string) => {
    setSelectedId(categoryId);
    reload();
    setModalOpen(false);
    setEditingCategory(null);
    setModalParentId(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setModalParentId(null);
  };

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
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <CategoryDetailsPanel
            category={selected}
            loading={loading}
            onReload={reload}
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
    </div>
  );
}
