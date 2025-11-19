'use client';

import * as React from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Loader } from '@/components/ui/Loader';
import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory | null;
  loading?: boolean;
  onReload?: () => void;
};

export function CategoryDetailsPanel({
  category,
  loading,
  onReload,
}: Props) {
  const [isToggling, setIsToggling] = React.useState(false);
  const [optimisticIsActive, setOptimisticIsActive] = React.useState<
    boolean | null
  >(null);

  React.useEffect(() => {
    if (category) {
      setOptimisticIsActive(null);
    }
  }, [category]);

  const handleToggleActive = async (checked: boolean) => {
    if (!category || isToggling) return;

    const previousValue = category.isActive;
    setOptimisticIsActive(checked);
    setIsToggling(true);

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          parentId: category.parentId,
          urlSegment: category.segment,
          isActive: checked,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error || 'Ошибка обновления категории');
      }

      // Reload categories to update the tree
      if (onReload) {
        onReload();
      }
    } catch (error) {
      console.error('Error toggling category active status:', error);
      // Revert optimistic update on error
      setOptimisticIsActive(previousValue);
    } finally {
      setIsToggling(false);
    }
  };

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

  const urlPath = category.urlPath ? `/catalog/${category.urlPath}` : '/catalog';
  const isActive =
    optimisticIsActive !== null ? optimisticIsActive : category.isActive;

  return (
    <Card className={isToggling ? 'relative' : ''}>
      {isToggling && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/30">
          <div className="flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm px-4 py-2 shadow-lg">
            <Loader size="sm" className="[&>div]:border-t-purple-600 dark:[&>div]:border-t-purple-400" />
            <span className="text-sm text-gray-700">Обновление...</span>
          </div>
        </div>
      )}
      <CardHeader className="flex flex-col gap-2 p-6 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-gray-900">{category.name}</p>
          <Badge
            size="sm"
            className={`text-xs ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200'
            }`}
          >
            {isActive ? 'Активна' : 'Скрыта'}
          </Badge>
          <Badge
            size="sm"
            className="bg-gray-100 text-xs font-semibold text-gray-600"
          >
            {category.totalProductCount} товаров
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          Путь: <span className="font-mono text-[11px]">{category.path}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-2 text-sm text-gray-700">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-gray-400">URL</p>
            <Link
              href={urlPath}
              target="_blank"
              className="text-violet-700 underline-offset-4 hover:underline"
            >
              {urlPath}
            </Link>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400">Slug</p>
            <p className="font-mono text-xs text-gray-700">{category.slug}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400">Порядок</p>
            <p>{category.sort}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400">Прямых товаров</p>
            <p>{category.directProductCount}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-gray-400">SEO</p>
          {category.seoTitle || category.seoDescription ? (
            <div className="mt-1 space-y-1 text-sm">
              {category.seoTitle && (
                <p className="font-medium text-gray-900">{category.seoTitle}</p>
              )}
              {category.seoDescription && (
                <p className="text-gray-600">{category.seoDescription}</p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              SEO-заголовок и описание не заполнены.
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label className="block text-sm font-medium text-gray-900">
                Показывать на сайте
              </Label>
              <p className="text-xs text-gray-500">
                Черновики сохраняются, но не попадают в каталог.
              </p>
            </div>
            <div className="relative inline-flex h-6 w-11">
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={isToggling}
                className={isToggling ? 'opacity-50' : ''}
              />
              {isToggling && (
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none ${
                  isActive ? 'right-0.5' : 'left-0.5'
                }`} style={{ width: '20px', height: '20px' }}>
                  <Loader size="sm" className="[&>div]:border-t-purple-600 dark:[&>div]:border-t-purple-400 [&>div]:border-gray-200 dark:[&>div]:border-gray-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
