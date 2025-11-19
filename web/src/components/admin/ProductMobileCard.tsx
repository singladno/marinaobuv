'use client';

import * as React from 'react';
import Image from 'next/image';
import { MessageSquare, Hand } from 'lucide-react';

import { ProductImagesCell } from '@/components/features/ProductImagesCell';
import { ProductNameCell } from '@/components/features/ProductNameCell';
import { ProductArticleCell } from '@/components/features/ProductArticleCell';
import { ProductCategoryCell } from '@/components/features/ProductCategoryCell';
import { ProductPriceCell } from '@/components/features/ProductPriceCell';
import { ProductGenderCell } from '@/components/features/ProductGenderCell';
import { ProductSeasonCell } from '@/components/features/ProductSeasonCell';
import { ProductSizesCell } from '@/components/features/ProductSizesCell';
import { ProductProviderCell } from '@/components/features/ProductProviderCell';
import { ProductSelectionCheckbox } from '@/components/features/ProductSelectionCheckbox';
import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { useUser } from '@/contexts/NextAuthUserContext';
import type { Product, ProductUpdateData } from '@/types/product';
import type { CategoryNode } from '@/components/ui/CategorySelector';

interface ProductMobileCardProps {
  product: Product;
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  categories: CategoryNode[];
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit?: (productId: string) => void;
  onEditImages?: (productId: string) => void;
}

export function ProductMobileCard({
  product,
  onUpdateProduct,
  categories,
  selected,
  onToggle,
  onEdit,
  onEditImages,
}: ProductMobileCardProps) {
  const { user } = useUser();
  const [isToggling, setIsToggling] = React.useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = React.useState(false);
  const isActive = product.isActive;

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onUpdateProduct(product.id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling product active status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4">
          {/* Header with checkbox and toggle */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ProductSelectionCheckbox
                id={product.id}
                selected={selected}
                onToggle={onToggle}
              />
              <div className="flex-1 min-w-0 mr-6">
                <ProductNameCell
                  product={product}
                  onUpdateProduct={onUpdateProduct}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Edit button removed on iPad - fields are inline editable */}

              {/* WhatsApp/Source button */}
              {user?.role === 'ADMIN' &&
                product.sourceMessageIds &&
                product.sourceMessageIds.length > 0 && (
                  <button
                    onClick={() => setIsSourceModalOpen(true)}
                    className="shrink-0 cursor-pointer rounded focus:outline-none"
                    title={`Просмотреть ${product.sourceMessageIds.length} источник${product.sourceMessageIds.length === 1 ? '' : product.sourceMessageIds.length < 5 ? 'а' : 'ов'}`}
                    aria-label="Просмотреть источник"
                  >
                    {product.source === 'WA' ? (
                      <Image
                        src="/images/whatsapp-icon.png"
                        alt="WhatsApp"
                        width={36}
                        height={36}
                        className="h-8 w-8 rounded"
                        unoptimized
                      />
                    ) : (
                      <MessageSquare className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}
              {/* MANUAL source icon */}
              {user?.role === 'ADMIN' && product.source === 'MANUAL' && (
                <div
                  className="shrink-0 rounded"
                  title="Создан вручную"
                  aria-label="Создан вручную"
                >
                  <Hand className="h-6 w-6 text-gray-500 dark:text-gray-500" strokeWidth={1.5} />
                </div>
              )}

              {/* Toggle switch */}
              <button
                onClick={handleToggleActive}
                disabled={isToggling}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label={isActive ? 'Деактивировать товар' : 'Активировать товар'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Изображения
            </div>
            <ProductImagesCell product={product} onEditImages={onEditImages} />
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Артикул
              </div>
              <ProductArticleCell
                product={product}
                onUpdateProduct={onUpdateProduct}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Цена
              </div>
              <ProductPriceCell
                product={product}
                onUpdateProduct={onUpdateProduct}
                priceInKopecks={product.pricePair}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Категория
              </div>
              <ProductCategoryCell
                product={product}
                onUpdateProduct={onUpdateProduct}
                categories={categories}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Поставщик
              </div>
              <ProductProviderCell product={product} />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Пол
              </div>
              <ProductGenderCell
                product={product}
                gender={product.gender}
                onUpdateProduct={onUpdateProduct}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Сезон
              </div>
              <ProductSeasonCell
                product={product}
                season={product.season}
                onUpdateProduct={onUpdateProduct}
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Размеры
            </div>
            <ProductSizesCell
              sizes={product.sizes}
              onChange={async sizes => {
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

                const currentSizes = product.sizes || [];
                if (!sizesChanged(currentSizes, sizes)) {
                  return; // No changes, skip update
                }

                try {
                  await onUpdateProduct(product.id, { sizes });
                } catch (error) {
                  console.error('Error updating sizes:', error);
                }
              }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Статус:</span>
            <span
              className={`text-xs font-medium ${
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {isActive ? 'Активен' : 'Неактивен'}
            </span>
          </div>
        </div>
      </div>

      {/* Source Modal */}
      {user?.role === 'ADMIN' && (
        <ProductSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          productId={product.id}
          productName={product.name}
        />
      )}
    </>
  );
}
