import { useState } from 'react';

import { ProductBulkOperations } from '@/components/features/ProductBulkOperations';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { useAllCategories } from '@/hooks/useAllCategories';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
import { useProductHandlers } from '@/hooks/useProductHandlers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { useUploadProductImages } from '@/hooks/useUploadProductImages';
import type { ImageFile } from './CreateProductModal';
import { createProductColumns } from '@/utils/productColumnConfigs';
import type { Product } from '@/types/product';

import { ProductMobileCard } from './ProductMobileCard';
import { CreateProductModal, type CreateProductData } from './CreateProductModal';
import { EditProductModal } from './EditProductModal';
import { EditProductImagesModal } from './EditProductImagesModal';

type ProductWithSelected = Product & { selected?: boolean };

export function ProductsPageContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditImagesModalOpen, setIsEditImagesModalOpen] = useState(false);
  const [editingImagesProductId, setEditingImagesProductId] = useState<string | null>(null);

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

  const { createProduct, isLoading: isCreating } = useCreateProduct();
  const { uploadImages } = useUploadProductImages();

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

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingProductId(null);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    // Reload products list to show updated product
    reload();
  };

  const handleEditImages = (productId: string) => {
    setEditingImagesProductId(productId);
    setIsEditImagesModalOpen(true);
  };

  const handleEditImagesModalClose = () => {
    setIsEditImagesModalOpen(false);
    setEditingImagesProductId(null);
  };

  const columns = createProductColumns({
    onUpdateProduct: handleUpdateProduct,
    categories,
    onToggle,
    onSelectAll,
    allSelected,
    someSelected,
    onEdit: handleEditProduct,
    onEditImages: handleEditImages,
  });

  // Map products with selected state
  const productsWithSelected = products.map(product => ({
    ...product,
    selected: selected[product.id] || false,
  }));

  const handleCreateProduct = async (data: CreateProductData) => {
    try {
      // Extract images and source screenshot from data
      const { images, sourceScreenshot, ...productData } = data;

      // Create product first
      const product = await createProduct(productData);

      // Upload images if any
      if (images && images.length > 0) {
        try {
          await uploadImages(product.id, images);
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          // Don't fail the whole operation if images fail to upload
          // Product is already created
        }
      }

      // Upload source screenshot if provided
      if (sourceScreenshot && sourceScreenshot.file) {
        try {
          const formData = new FormData();
          formData.append('file', sourceScreenshot.file);

          const response = await fetch(
            `/api/admin/products/${product.id}/source-screenshot`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!response.ok) {
            console.error('Error uploading source screenshot:', await response.text());
            // Don't fail the whole operation if screenshot fails to upload
          }
        } catch (screenshotError) {
          console.error('Error uploading source screenshot:', screenshotError);
          // Don't fail the whole operation if screenshot fails to upload
        }
      }

      // Reload products list to show the new product
      reload();
    } catch (error) {
      // Error is handled by the modal
      throw error;
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <ProductBulkOperations
            selectedCount={selectedCount}
            onBulkActivate={handleBulkActivate}
            onBulkDeactivate={handleBulkDeactivate}
            onClearSelection={clearSelection}
          />
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          className="w-full sm:w-auto !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Создать товар
        </Button>
      </div>

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
              onEdit={handleEditProduct}
              onEditImages={handleEditImages}
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

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProduct}
        categories={categories}
        isLoading={isCreating}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        productId={editingProductId}
        categories={categories}
        onProductUpdated={handleProductUpdated}
      />

      <EditProductImagesModal
        isOpen={isEditImagesModalOpen}
        onClose={handleEditImagesModalClose}
        productId={editingImagesProductId}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}
