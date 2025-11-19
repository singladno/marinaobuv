import { createColumnHelper } from '@tanstack/react-table';

import { ProductActionsCell } from '@/components/features/ProductActionsCell';
import { ProductArticleCell } from '@/components/features/ProductArticleCell';
import { ProductCategoryCell } from '@/components/features/ProductCategoryCell';
import { ProductDateCell } from '@/components/features/ProductDateCell';
import { ProductDescriptionCell } from '@/components/features/ProductDescriptionCell';
import { ProductGenderCell } from '@/components/features/ProductGenderCell';
import { ProductGptDebugCell } from '@/components/features/ProductGptDebugCell';
import { ProductImagesCell } from '@/components/features/ProductImagesCell';
import { ProductNameCell } from '@/components/features/ProductNameCell';
import { ProductPriceCell } from '@/components/features/ProductPriceCell';
import { ProductProviderCell } from '@/components/features/ProductProviderCell';
import { ProductSeasonCell } from '@/components/features/ProductSeasonCell';
import { ProductSelectionCheckbox } from '@/components/features/ProductSelectionCheckbox';
import { ProductSizesCell } from '@/components/features/ProductSizesCell';
import type { CategoryNode } from '@/components/ui/CategorySelector';
import type { Product, ProductUpdateData } from '@/types/product';

type ProductWithSelected = Product & { selected?: boolean };

const columnHelper = createColumnHelper<ProductWithSelected>();

export function createProductColumnDefinitions({
  onUpdateProduct,
  categories,
  onToggle,
  onSelectAll,
  allSelected,
  someSelected,
  onEdit,
  onEditImages,
}: {
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  categories: CategoryNode[];
  onToggle?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onEdit?: (productId: string) => void;
  onEditImages?: (productId: string) => void;
}) {
  return [
    // Selection column
    columnHelper.display({
      id: 'select',
      header: () =>
        onSelectAll ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected || false}
              ref={input => {
                if (input)
                  input.indeterminate =
                    (someSelected || false) && !(allSelected || false);
              }}
              onChange={e => onSelectAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              title={allSelected ? 'Снять выделение со всех' : 'Выделить все'}
            />
          </div>
        ) : (
          ''
        ),
      cell: info => (
        <ProductSelectionCheckbox
          id={info.row.original.id}
          selected={Boolean(info.row.original.selected)}
          onToggle={onToggle || (() => {})}
        />
      ),
      meta: {
        frozen: 'left',
      },
    }),

    // Images column - show row of images with hover toggles and modal
    columnHelper.accessor('images', {
      id: 'images',
      header: 'Изображения',
      cell: ({ row }) => (
        <ProductImagesCell
          product={row.original}
          onEditImages={onEditImages}
        />
      ),
    }),

    // Name column
    columnHelper.accessor('name', {
      header: 'Название',
      meta: { width: '400px' },
      cell: ({ row }) => (
        <ProductNameCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
          disabled={row.original.isActive}
        />
      ),
    }),

    // Article column
    columnHelper.accessor('article', {
      header: 'Артикул',
      meta: { width: '170px' },
      cell: ({ row }) => (
        <ProductArticleCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
          disabled={row.original.isActive}
        />
      ),
    }),

    // Description column
    columnHelper.accessor('description', {
      header: 'Описание',
      meta: { width: '350px' },
      cell: ({ row }) => (
        <ProductDescriptionCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
        />
      ),
      size: 350, // Wider column for description
    }),

    // Category column
    columnHelper.accessor('category.name', {
      id: 'category',
      header: 'Категория',
      cell: ({ row }) => (
        <ProductCategoryCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
          categories={categories}
        />
      ),
    }),

    // Provider column
    columnHelper.display({
      id: 'provider',
      header: 'Поставщик',
      cell: ({ row }) => <ProductProviderCell product={row.original} />,
    }),

    // Price column
    columnHelper.accessor('pricePair', {
      header: 'Цена (руб.)',
      cell: ({ row, getValue }) => (
        <ProductPriceCell
          product={row.original}
          priceInKopecks={getValue()}
          onUpdateProduct={onUpdateProduct}
        />
      ),
      size: 200, // Twice as wide
    }),

    // Gender column
    columnHelper.accessor('gender', {
      header: 'Пол',
      meta: { width: '160px' },
      cell: ({ row, getValue }) => (
        <ProductGenderCell
          product={row.original}
          gender={getValue()}
          onUpdateProduct={onUpdateProduct}
          disabled={row.original.isActive}
        />
      ),
      size: 160,
    }),

    // Season column
    columnHelper.accessor('season', {
      header: 'Сезон',
      meta: { width: '160px' },
      cell: ({ row, getValue }) => (
        <ProductSeasonCell
          product={row.original}
          season={getValue()}
          onUpdateProduct={onUpdateProduct}
          disabled={row.original.isActive}
        />
      ),
      size: 160,
    }),

    // Sizes column
    columnHelper.accessor('sizes', {
      header: 'Размеры',
      cell: ({ getValue, row }) => {
        const currentSizes = getValue() || [];

        // Helper to compare sizes arrays
        const sizesChanged = (
          oldSizes: Array<{ size: string; count: number }>,
          newSizes: Array<{ size: string; count: number }>
        ): boolean => {
          if (oldSizes.length !== newSizes.length) return true;
          const oldMap = new Map(
            oldSizes.map(s => [s.size, s.count])
          );
          const newMap = new Map(
            newSizes.map(s => [s.size, s.count])
          );
          if (oldMap.size !== newMap.size) return true;
          for (const [size, count] of oldMap) {
            if (newMap.get(size) !== count) return true;
          }
          return false;
        };

        return (
          <ProductSizesCell
            sizes={currentSizes}
            disabled={row.original.isActive}
            onChange={async sizes => {
              if (!sizesChanged(currentSizes, sizes)) {
                return; // No changes, skip update
              }

              try {
                await onUpdateProduct(row.original.id, { sizes });
              } catch (error) {
                console.error('Error updating sizes:', error);
                throw error;
              }
            }}
          />
        );
      },
    }),

    // Created date column
    columnHelper.accessor('createdAt', {
      header: 'Создан',
      cell: ({ getValue }) => <ProductDateCell date={getValue()} />,
    }),

    // GPT Debug column
    columnHelper.display({
      id: 'gptDebug',
      header: 'GPT Debug',
      cell: ({ row }) => <ProductGptDebugCell product={row.original} />,
      size: 150,
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: () => '',
      cell: ({ row }) => (
        <ProductActionsCell
          product={row.original}
          onUpdateProduct={onUpdateProduct}
          onEdit={onEdit}
        />
      ),
      meta: {
        frozen: 'right',
        width: 180,
      },
    }),
  ];
}
