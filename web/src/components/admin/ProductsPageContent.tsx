import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useCategories } from '@/hooks/useCategories';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
import { useProductHandlers } from '@/hooks/useProductHandlers';
import { useProducts } from '@/hooks/useProducts';
import { createProductColumns } from '@/utils/productColumnConfigs';
import type { Product } from '@/types/product';

type ProductWithSelected = Product & { selected?: boolean };

export function ProductsPageContent() {
  const {
    products,
    loading,
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
    confirmationModal,
  } = useProductBulkOperations(products, updateProduct, deleteProduct);

  const {
    handleUpdateProduct,
    handleDeleteProduct,
    handleBulkDelete,
    handleBulkActivate,
    handleBulkDeactivate,
  } = useProductHandlers({
    updateProduct,
    deleteProduct,
    onBulkDelete: async () => {
      const result = await onBulkDelete();
      return result;
    },
    onBulkActivate,
    onBulkDeactivate,
    selectedCount,
  });

  const columns = createProductColumns({
    onUpdateProduct: handleUpdateProduct,
    onDeleteProduct: handleDeleteProduct,
    categories,
    onToggle,
    onSelectAll,
    allSelected,
    someSelected,
  });

  // Map products with selected state
  const productsWithSelected = products.map(product => ({
    ...product,
    selected: selected[product.id] || false,
  }));

  return (
    <div className="space-y-4">
      <ProductBulkOperations
        selectedCount={selectedCount}
        onBulkDelete={handleBulkDelete}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onClearSelection={clearSelection}
      />

      <UnifiedDataTable<ProductWithSelected, unknown>
        data={productsWithSelected}
        columns={columns as any}
        loading={loading}
        pagination={pagination}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.handleCancel}
        onConfirm={confirmationModal.handleConfirm}
        title={confirmationModal.options.title}
        message={confirmationModal.options.message}
        confirmText={confirmationModal.options.confirmText}
        cancelText={confirmationModal.options.cancelText}
        variant={confirmationModal.options.variant}
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
}
