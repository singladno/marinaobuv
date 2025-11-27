'use client';

import * as React from 'react';
import Link from 'next/link';

import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory;
};

export function CategoryDetailsInfo({ category }: Props) {
  const urlPath = category.urlPath
    ? `/catalog/${category.urlPath}`
    : '/catalog';

  return (
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
  );
}
