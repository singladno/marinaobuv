'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory | null;
  loading?: boolean;
};

export function CategoryDetailsPanel({ category, loading }: Props) {
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 p-6 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-gray-900">{category.name}</p>
          <Badge
            size="sm"
            className={`text-xs ${
              category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200'
            }`}
          >
            {category.isActive ? 'Активна' : 'Скрыта'}
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
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
          Страницы каталога работают на клиентских запросах. Новая категория
          появляется сразу после сохранения — никаких деплоев. Фронтенд читает
          структуру через `/api/categories/*`, поэтому обновления видны и для
          покупателей, и в фильтрах.
        </div>

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

        <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">
          Обновляйте ветку через форму справа: указываем название, сегмент URL и
          родителя. Slug генерируется автоматически, а URL становится
          доступным для `/catalog/{segment}`.
        </div>
      </CardContent>
    </Card>
  );
}
