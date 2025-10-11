'use client';

import React from 'react';

import type { Product, ProductUpdateData } from '@/types/product';
import type { CategoryNode } from '@/components/ui/CategorySelector';

import { ProductCategoryCell } from './ProductCategoryCell';
import { ProductImageCell } from './ProductImageCell';
import { ProductPriceCell } from './ProductPriceCell';
import { ProductSizesCell } from './ProductSizesCell';
import { ProductStatusCell } from './ProductStatusCell';

interface ProductTableRowProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  categories: CategoryNode[];
}

export function ProductTableRow({
  product,
  onUpdateProduct,
  categories,
}: ProductTableRowProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <ProductImageCell product={product} />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <ProductPriceCell product={product} onUpdateProduct={onUpdateProduct} />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <ProductCategoryCell
          product={product}
          onUpdateProduct={onUpdateProduct}
          categories={categories}
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <ProductSizesCell
          sizes={product.sizes}
          onChange={async sizes => {
            // Note: sizes update might need a different API endpoint
            console.log('Sizes update not implemented yet', sizes);
          }}
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <ProductStatusCell
          product={product}
          onUpdateProduct={onUpdateProduct}
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {formatDate(product.createdAt)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {formatDate(product.updatedAt)}
      </td>
    </tr>
  );
}
