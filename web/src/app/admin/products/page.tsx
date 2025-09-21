'use client';

import React from 'react';

import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
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
    deleteProduct,
    goToPage,
    changePageSize,
  } = useProducts();

  const { categories } = useCategories();
  const { addNotification } = useNotifications();

  const {
    selected,
    selectedCount,
    allSelected,
    someSelected,
    onToggle,
    onSelectAll,
    onBulkDelete,
    onBulkActivate,
    onBulkDeactivate,
    clearSelection,
  } = useProductBulkOperations(products, updateProduct, deleteProduct);

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

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      addNotification({
        type: 'success',
        message: 'Товар успешно удален',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Ошибка при удалении товара',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete();
      addNotification({
        type: 'success',
        message: `Удалено товаров: ${selectedCount}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Ошибка при удалении товаров',
      });
    }
  };

  const handleBulkActivate = async () => {
    try {
      await onBulkActivate();
      addNotification({
        type: 'success',
        message: `Активировано товаров: ${selectedCount}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Ошибка при активации товаров',
      });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await onBulkDeactivate();
      addNotification({
        type: 'success',
        message: `Деактивировано товаров: ${selectedCount}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Ошибка при деактивации товаров',
      });
    }
  };

  const handleFiltersChange = (newFilters: {
    search?: string;
    categoryId?: string;
  }) => {
    setFilters(newFilters);
  };

  // Add selected property to products for the table
  const productsWithSelection = products.map(product => ({
    ...product,
    selected: selected[product.id] || false,
  }));

  const columns = createProductColumns({
    onUpdateProduct: handleUpdateProduct,
    onDeleteProduct: handleDeleteProduct,
    categories,
    onToggle,
    onSelectAll,
    allSelected,
    someSelected,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Управление товарами
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Просмотр и редактирование всех товаров в каталоге
        </p>
      </div>

      {/* Bulk operations */}
      <div className="mb-4">
        <ProductBulkOperations
          selectedCount={selectedCount}
          onBulkDelete={handleBulkDelete}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onClearSelection={clearSelection}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <UnifiedDataTable
          columns={columns}
          data={productsWithSelection}
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
