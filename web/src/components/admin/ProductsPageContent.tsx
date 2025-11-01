import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAllCategories } from '@/hooks/useAllCategories';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
import { useProductHandlers } from '@/hooks/useProductHandlers';
import { useProducts } from '@/hooks/useProducts';
import { createProductColumns } from '@/utils/productColumnConfigs';
import type { Product } from '@/types/product';

import { ProductMobileCard } from './ProductMobileCard';

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
    goToPage,
    changePageSize,
  } = useProducts();

  // Use the full categories tree for admin to ensure complete selection
  const { categories } = useAllCategories();

  const {
    selected,
    selectedCount,
    allSelected,
    someSelected,
    onToggle,
    onSelectAll,
    onBulkActivate,
    onBulkDeactivate,
    clearSelection,
    confirmationModal,
  } = useProductBulkOperations(products, updateProduct, async () => {});

  const {
    handleUpdateProduct,
    handleBulkActivate,
    handleBulkDeactivate,
  } = useProductHandlers({
    updateProduct,
    deleteProduct: async () => {},
    onBulkDelete: async () => false,
    onBulkActivate,
    onBulkDeactivate,
    selectedCount,
  });

  const columns = createProductColumns({
    onUpdateProduct: handleUpdateProduct,
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
    <div className="space-y-3 md:space-y-4">
      <ProductBulkOperations
        selectedCount={selectedCount}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onClearSelection={clearSelection}
      />

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <UnifiedDataTable<ProductWithSelected, unknown>
          data={productsWithSelected}
          columns={columns as any}
          loading={loading}
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          renderMobileCard={(product: ProductWithSelected) => (
            <ProductMobileCard
              product={product}
              onUpdateProduct={handleUpdateProduct}
              categories={categories}
              selected={selected[product.id] || false}
              onToggle={onToggle || (() => {})}
            />
          )}
        />
      </div>

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
