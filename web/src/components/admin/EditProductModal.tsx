'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { type CategoryNode } from '@/components/ui/CategorySelector';
import { useEditProductForm } from '@/hooks/useEditProductForm';
import { useUpdateProduct } from '@/hooks/useUpdateProduct';

import { CreateProductFormFields } from './CreateProductFormFields';
import { ProductImageUpload, type ImageFile } from './ProductImageUpload';
import type { CreateProductData } from './CreateProductModal';

export type { ImageFile };

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  categories: CategoryNode[];
  onProductUpdated?: () => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  productId,
  categories,
  onProductUpdated,
}: EditProductModalProps) {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    validate,
    prepareSubmitData,
    reset,
    clearError,
    images,
    setImages,
    loading: loadingProduct,
  } = useEditProductForm(productId);
  const { updateProduct, isLoading: isUpdating } = useUpdateProduct();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);

  // Mark form as ready once product data is loaded
  useEffect(() => {
    if (!loadingProduct && productId && formData.name) {
      // Small delay to ensure all form fields are rendered
      const timer = setTimeout(() => {
        setFormReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!productId) {
      setFormReady(false);
    }
  }, [loadingProduct, productId, formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      return;
    }

    // Blur all active inputs to ensure any pending debounced updates complete
    const activeElement = document.activeElement;
    if (activeElement && activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    // Also blur all size-related inputs to ensure all pending changes are committed
    const sizeInputs = document.querySelectorAll(
      'input[aria-label*="Количество"], input[aria-label*="Размер"]'
    );
    sizeInputs.forEach(input => {
      if (input instanceof HTMLElement) {
        input.blur();
      }
    });

    // Wait a bit for any debounced onChange callbacks to complete
    // Size changes are now saved immediately, but we wait for debounced updates
    await new Promise(resolve => setTimeout(resolve, 200));

    // Validate form
    if (!validate()) {
      return;
    }

    // Filter out deleted images
    const activeImages = images.filter(img => !img.isDeleted);

    // Validate images have colors (only for new images)
    const newImages = activeImages.filter(
      img => !img.preview.startsWith('http')
    );
    const imagesWithoutColor = newImages.filter(img => !img.color.trim());
    if (imagesWithoutColor.length > 0) {
      setErrors({ submit: 'Укажите цвет для всех новых изображений' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = prepareSubmitData();
      console.log(
        '[EditProductModal] Submitting data with sizes:',
        JSON.stringify(submitData.sizes)
      );
      await updateProduct(productId, submitData);

      // Handle new image uploads if there are any
      const newImages = activeImages.filter(
        img => !img.preview.startsWith('http')
      );
      if (newImages.length > 0) {
        // TODO: Implement new image upload logic if needed
        console.log('New images to upload:', newImages.length);
      }

      reset();
      setImages([]);
      onProductUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      setErrors({
        submit: 'Не удалось обновить товар. Попробуйте еще раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isUpdating) {
      reset();
      // Clean up image previews
      images.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setImages([]);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof CreateProductData, value: any) => {
    // Use functional update to ensure we have the latest formData
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Редактировать товар"
      size="fullscreen"
    >
      <div className="flex h-full flex-col overflow-hidden">
        {loadingProduct ? (
          <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Загрузка товара...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-4xl space-y-4 sm:space-y-6"
              >
                {/* Images Section */}
                <ProductImageUpload
                  images={images}
                  onImagesChange={setImages}
                  disabled={isSubmitting || isUpdating}
                />

                <CreateProductFormFields
                  formData={formData}
                  errors={errors}
                  categories={categories}
                  isSubmitting={isSubmitting || isUpdating || !formReady}
                  onFieldChange={handleFieldChange}
                  onClearError={clearError}
                />

                {/* Error message */}
                {errors.submit && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {errors.submit}
                  </div>
                )}
              </form>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto flex max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting || isUpdating}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUpdating || loadingProduct}
                  className="w-full !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white sm:w-auto"
                >
                  {isSubmitting || isUpdating
                    ? 'Сохранение...'
                    : 'Сохранить изменения'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
