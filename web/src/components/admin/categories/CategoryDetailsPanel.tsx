'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useCategoryToggle } from '@/hooks/useCategoryToggle';
import type { FlatAdminCategory } from '@/types/category';

import { CategoryDetailsInfo } from './CategoryDetailsInfo';
import { CategoryDetailsSeo } from './CategoryDetailsSeo';
import { CategoryDetailsHeader } from './CategoryDetailsHeader';
import { CategoryDetailsToggle } from './CategoryDetailsToggle';

type Props = {
  category: FlatAdminCategory | null;
  loading?: boolean;
  onReload?: () => void;
  onDelete?: (category: FlatAdminCategory) => void;
};

export function CategoryDetailsPanel({
  category,
  loading,
  onReload,
  onDelete,
}: Props) {
  const { isToggling, isActive, handleToggleActive } = useCategoryToggle(
    category,
    onReload
  );

  if (loading && !category) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Загрузка сведений о категории...
        </CardContent>
      </Card>
    );
  }

  if (!category) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Выберите категорию в дереве, чтобы увидеть подробности и SEO-данные.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isToggling ? 'relative' : ''}>
      {isToggling && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/30">
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
            <Loader
              size="sm"
              className="[&>div]:border-t-purple-600 dark:[&>div]:border-t-purple-400"
            />
            <span className="text-sm text-gray-700">Обновление...</span>
          </div>
        </div>
      )}
      <CardHeader className="flex flex-col gap-2 p-6 pb-3">
        <CategoryDetailsHeader category={category} isActive={isActive} />
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-2 text-sm text-gray-700">
        <CategoryDetailsInfo category={category} />
        <CategoryDetailsSeo category={category} />
        <CategoryDetailsToggle
          category={category}
          isActive={isActive}
          isToggling={isToggling}
          onToggle={handleToggleActive}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
