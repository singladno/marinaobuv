'use client';

import * as React from 'react';

import { useAdminCategories } from '@/hooks/useAdminCategories';
import type { FlatAdminCategory } from '@/types/category';

import { CategoryTreePanel } from './CategoryTreePanel';
import { CategoryDetailsPanel } from './CategoryDetailsPanel';
import { CategoryCreatePanel } from './CategoryCreatePanel';

export function AdminCategoriesPageContent() {
  const { tree, flat, loading, error, reload } = useAdminCategories();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loading || tree.length === 0) return;
    setSelectedId(prev => {
      if (prev && flat.some(item => item.id === prev)) return prev;
      return tree[0].id;
    });
  }, [loading, tree, flat]);

  const selected = React.useMemo<FlatAdminCategory | null>(() => {
    if (!selectedId) return null;
    return flat.find(item => item.id === selectedId) ?? null;
  }, [flat, selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-96">
          <CategoryTreePanel
            tree={tree}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
            onReload={reload}
          />
        </div>
        <div className="flex-1 space-y-4">
          <CategoryDetailsPanel
            category={selected}
            loading={loading}
          />
          <CategoryCreatePanel
            parents={flat}
            defaultParentId={selected?.id ?? null}
            onCreated={newCategoryId => {
              setSelectedId(newCategoryId);
              reload();
            }}
          />
        </div>
      </div>
    </div>
  );
}
