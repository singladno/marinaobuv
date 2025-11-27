'use client';

import * as React from 'react';

import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory;
};

export function CategoryDetailsSeo({ category }: Props) {
  return (
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
  );
}
