'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/Badge';
import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory;
  isActive: boolean;
};

export function CategoryDetailsHeader({ category, isActive }: Props) {
  return (
    <>
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
    </>
  );
}
