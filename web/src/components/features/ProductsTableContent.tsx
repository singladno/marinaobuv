'use client';

import React from 'react';

import type { Product, ProductUpdateData } from '@/types/product';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { ProductTableRow } from './ProductTableRow';

interface ProductsTableContentProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  categories: CategoryNode[];
}

export function ProductsTableContent({
  products,
  loading,
  error,
  onUpdateProduct,
  categories,
}: ProductsTableContentProps) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={10}
            className="border-b border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-2">Загрузка товаров...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (error) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={10}
            className="border-b border-gray-200 px-4 py-8 text-center text-red-500 dark:border-gray-700"
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium">Ошибка загрузки</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {error}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (products.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={10}
            className="border-b border-gray-200 px-4 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            Товары не найдены
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
      {products.map(product => (
        <ProductTableRow
          key={product.id}
          product={product}
          onUpdateProduct={onUpdateProduct}
          categories={categories}
        />
      ))}
    </tbody>
  );
}
