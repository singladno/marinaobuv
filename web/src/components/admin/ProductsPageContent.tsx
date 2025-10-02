import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
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
    onBulkDelete,
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
        data={products as ProductWithSelected[]}
        columns={columns as any}
        loading={loading}
        pagination={pagination}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}
