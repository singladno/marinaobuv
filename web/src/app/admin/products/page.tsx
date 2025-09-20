'use client';

import React from 'react';

import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { createProductColumns } from '@/utils/productColumnConfigs';

export default function AdminProductsPage() {
  const {
    products,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    reload,
    updateProduct,
    goToPage,
    changePageSize,
  } = useProducts();

  const { categories } = useCategories();
  const { addNotification } = useNotifications();

  const handleUpdateProduct = async (
    id: string,
    data: Record<string, unknown>
  ) => {
    try {
      await updateProduct(id, data);
      addNotification({
        type: 'success',
        message: 'Товар успешно обновлен',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Ошибка при обновлении товара',
      });
    }
  };

  const handleFiltersChange = (newFilters: {
    search?: string;
    categoryId?: string;
  }) => {
    setFilters(newFilters);
  };

  const columns = createProductColumns(handleUpdateProduct, categories);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Управление товарами
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Просмотр и редактирование всех активных товаров в каталоге
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <UnifiedDataTable
          columns={columns}
          data={products}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          isProductTable={true}
          filters={{
            search: filters.search || '',
            categoryId: filters.categoryId || '',
          }}
          onFiltersChange={handleFiltersChange}
          onUpdateProduct={handleUpdateProduct}
          onReload={reload}
          emptyMessage="Товары не найдены"
          loadingMessage="Загрузка товаров..."
        />
      </div>
    </div>
  );
}
