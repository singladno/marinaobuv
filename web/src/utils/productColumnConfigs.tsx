import { createColumnHelper } from '@tanstack/react-table';

import { ProductActionsCell } from '@/components/features/ProductActionsCell';
import { ProductArticleCell } from '@/components/features/ProductArticleCell';
import { ProductCategoryCell } from '@/components/features/ProductCategoryCell';
import { ProductDateCell } from '@/components/features/ProductDateCell';
import { ProductGenderCell } from '@/components/features/ProductGenderCell';
import { ProductImageCell } from '@/components/features/ProductImageCell';
import { ProductNameCell } from '@/components/features/ProductNameCell';
import { ProductPriceCell } from '@/components/features/ProductPriceCell';
import { ProductSeasonCell } from '@/components/features/ProductSeasonCell';
import { ProductSizesCell } from '@/components/features/ProductSizesCell';
import type { Product } from '@/types/product';

const columnHelper = createColumnHelper<Product>();

export function createProductColumns(
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>,
  categories: Array<{ id: string; name: string }>
) {
  return [
    columnHelper.accessor('images', {
      id: 'image',
      header: 'Изображение',
      cell: ({ row }) => <ProductImageCell product={row.original} />,
    }),

    columnHelper.accessor('name', {
      header: 'Название',
      cell: ({ row }) => (
        <ProductNameCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('article', {
      header: 'Артикул',
      cell: ({ row }) => (
        <ProductArticleCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('category.name', {
      id: 'category',
      header: 'Категория',
      cell: ({ row }) => (
        <ProductCategoryCell
          product={row.original}
          categories={categories}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('pricePair', {
      header: 'Цена (руб.)',
      cell: ({ row, getValue }) => (
        <ProductPriceCell
          product={row.original}
          priceInKopecks={getValue()}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('gender', {
      header: 'Пол',
      cell: ({ row, getValue }) => (
        <ProductGenderCell
          product={row.original}
          gender={getValue()}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('season', {
      header: 'Сезон',
      cell: ({ row, getValue }) => (
        <ProductSeasonCell
          product={row.original}
          season={getValue()}
          onUpdateProduct={onUpdateProduct}
        />
      ),
    }),

    columnHelper.accessor('sizes', {
      header: 'Размеры',
      cell: ({ getValue }) => <ProductSizesCell sizes={getValue()} />,
    }),

    columnHelper.accessor('createdAt', {
      header: 'Создан',
      cell: ({ getValue }) => <ProductDateCell date={getValue()} />,
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Действия',
      cell: () => <ProductActionsCell />,
    }),
  ];
}
