import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCategories } from '@/hooks/useCategories';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
import { useProducts } from '@/hooks/useProducts';
import { createProductColumns } from '@/utils/productColumnConfigs';

export function ProductsPageContent() {
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
        title: 'Товар обновлен',
        message: 'Товар успешно обновлен.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: 'Не удалось обновить товар.',
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      addNotification({
        type: 'success',
        title: 'Товар удален',
        message: 'Товар успешно удален.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: 'Не удалось удалить товар.',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete();
      addNotification({
        type: 'success',
        title: 'Товары удалены',
        message: `${selectedCount} товаров успешно удалено.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: 'Не удалось удалить товары.',
      });
    }
  };

  const handleBulkActivate = async () => {
    try {
      await onBulkActivate();
      addNotification({
        type: 'success',
        title: 'Товары активированы',
        message: `${selectedCount} товаров успешно активировано.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка активации',
        message: 'Не удалось активировать товары.',
      });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await onBulkDeactivate();
      addNotification({
        type: 'success',
        title: 'Товары деактивированы',
        message: `${selectedCount} товаров успешно деактивировано.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка деактивации',
        message: 'Не удалось деактивировать товары.',
      });
    }
  };

  const columns = createProductColumns({
    onUpdate: handleUpdateProduct,
    onDelete: handleDeleteProduct,
    onToggle,
    categories,
    onReload: reload,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Ошибка загрузки товаров: {error}</p>
          <button
            onClick={reload}
            className="mt-2 text-blue-600 hover:text-blue-500"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управление товарами</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={reload}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Обновить
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <ProductBulkOperations
          selectedCount={selectedCount}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          onBulkDelete={handleBulkDelete}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onClearSelection={clearSelection}
        />
      )}

      <UnifiedDataTable
        data={products}
        columns={columns}
        pagination={pagination}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
        selected={selected}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        allSelected={allSelected}
        someSelected={someSelected}
      />
    </div>
  );
}
