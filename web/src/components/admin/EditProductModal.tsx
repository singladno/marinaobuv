'use client';

import { useState, useEffect, useRef } from 'react';

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
  onProductUpdated?: (updatedProduct: any) => void;
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
  const originalImagesRef = useRef<ImageFile[]>([]);

  // Store original images when they're loaded
  useEffect(() => {
    if (
      !loadingProduct &&
      images.length > 0 &&
      originalImagesRef.current.length === 0
    ) {
      originalImagesRef.current = JSON.parse(JSON.stringify(images));
    }
  }, [loadingProduct, images]);

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
      originalImagesRef.current = []; // Reset when modal closes
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
      const updatedProduct = await updateProduct(productId, submitData);

      // Update image metadata (isPrimary, sort, color) only for images that changed
      const originalImages = originalImagesRef.current;
      const originalImageMap = new Map(
        originalImages.map(img => [img.id, img])
      );

      // Find images that actually changed
      // Get original active images with their original order
      const originalActiveImages = originalImages.filter(img => !img.isDeleted);

      const imagesToUpdate = activeImages
        .filter(img => img.preview.startsWith('http') && img.id) // Only existing images
        .map((img, newIndex) => {
          const original = originalImageMap.get(img.id);
          if (!original) {
            // Image not in original list - skip (new images are handled separately)
            return null;
          }

          // Find original index in active images
          const originalIndex = originalActiveImages.findIndex(
            (o: any) => o.id === img.id
          );

          // If image wasn't in original active images and wasn't deleted, it's a new image - skip
          // But if it was deleted and is now active, we need to restore it
          if (originalIndex === -1 && !original.isDeleted) {
            return null;
          }

          // Check if anything changed (excluding sort - no UI to change sort order)
          const colorChanged =
            (original.color || '').trim() !== (img.color || '').trim();
          const isPrimaryChanged = original.isPrimary !== img.isPrimary;
          const wasDeleted = original.isDeleted;
          const isNowActive = !img.isDeleted;

          // If nothing changed, skip
          if (
            !colorChanged &&
            !isPrimaryChanged &&
            wasDeleted === img.isDeleted
          ) {
            return null;
          }

          // If only isPrimary changed, we'll handle it separately - don't include in batch updates
          const onlyPrimaryChanged =
            isPrimaryChanged && !colorChanged && wasDeleted === img.isDeleted;

          return {
            img,
            colorChanged,
            isPrimaryChanged,
            wasDeleted,
            isNowActive,
            onlyPrimaryChanged,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Update only changed images (excluding those that only changed isPrimary - handled separately)
      // First, filter out images that only changed isPrimary and build payloads
      const imagesWithPayloads = imagesToUpdate
        .filter(item => !item.onlyPrimaryChanged) // Skip images that only changed isPrimary
        .map(({ img, colorChanged, wasDeleted, isNowActive }) => {
          const updatePayload: any = {};

          // Only include fields that changed (no sort - no UI to change sort order)
          if (colorChanged) {
            updatePayload.color = img.color || null;
          }
          if (wasDeleted && isNowActive) {
            // Image was restored
            updatePayload.isActive = true;
          }

          // Only include if there are actual changes to send
          if (Object.keys(updatePayload).length === 0) {
            return null;
          }

          return { img, updatePayload, isPrimary: img.isPrimary };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Now send requests only for images with actual changes
      const imageUpdateResults = await Promise.all(
        imagesWithPayloads.map(async ({ img, updatePayload, isPrimary }) => {
          try {
            const response = await fetch(
              `/api/admin/products/images/${img.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
              }
            );

            if (!response.ok) {
              console.error(`Failed to update image ${img.id}`);
              return { image: null, isPrimary, skip: true };
            }

            const result = await response.json();
            return {
              image: result.image,
              isPrimary,
              skip: false,
            };
          } catch (error) {
            console.error(`Error updating image ${img.id}:`, error);
            return { image: null, isPrimary, skip: true };
          }
        })
      );

      // Now set isPrimary for the primary image if it changed (this will unset it for others via API)
      const primaryImage = activeImages.find(
        img => img.isPrimary && img.preview.startsWith('http') && img.id
      );
      const originalPrimaryImage = originalImages.find(
        img => img.isPrimary && !img.isDeleted
      );

      let primaryImageUpdate: any = null;
      // Only update if primary image actually changed
      if (
        primaryImage &&
        (!originalPrimaryImage || originalPrimaryImage.id !== primaryImage.id)
      ) {
        // Check if this image was already updated in the batch (to avoid duplicate request)
        const alreadyUpdated = imageUpdateResults.some(
          (result: any) => result?.image?.id === primaryImage.id && !result.skip
        );

        if (!alreadyUpdated) {
          try {
            const response = await fetch(
              `/api/admin/products/images/${primaryImage.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isPrimary: true }),
              }
            );
            if (response.ok) {
              const result = await response.json();
              primaryImageUpdate = result.image;
            }
          } catch (error) {
            console.error(
              `Error setting primary image ${primaryImage.id}:`,
              error
            );
          }
        } else {
          // If already updated, get it from the results
          const updatedResult = imageUpdateResults.find(
            (result: any) =>
              result?.image?.id === primaryImage.id && !result.skip
          );
          if (updatedResult?.image) {
            primaryImageUpdate = { ...updatedResult.image, isPrimary: true };
          }
        }
      }

      // Construct updated product with new image data
      // Merge updated images with existing images, replacing updated ones
      const updatedImageMap = new Map(
        imageUpdateResults
          .filter(
            (
              result
            ): result is { image: any; isPrimary: boolean; skip: boolean } =>
              result !== null && !result.skip && result.image !== null
          )
          .map(result => {
            // If this is the primary image and we have an update, use the update
            if (
              primaryImageUpdate &&
              result.image.id === primaryImageUpdate.id
            ) {
              return [result.image.id, primaryImageUpdate];
            }
            return [
              result.image.id,
              { ...result.image, isPrimary: result.isPrimary },
            ];
          })
      );

      const finalImages = (updatedProduct.images || [])
        .filter((img: any) => {
          // Only include active images (exclude deleted ones)
          const updated = updatedImageMap.get(img.id);
          return (
            updated || !images.find((i: any) => i.id === img.id && i.isDeleted)
          );
        })
        .map((img: any) => {
          const updated = updatedImageMap.get(img.id);
          if (updated) {
            return updated;
          }
          // If image wasn't updated but exists, check if it should be marked as primary
          const localImage = images.find((i: any) => i.id === img.id);
          if (localImage) {
            return { ...img, isPrimary: localImage.isPrimary || false };
          }
          return img;
        });

      // Sort images by isPrimary desc, then sort asc (matching API behavior)
      finalImages.sort((a: any, b: any) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sort || 0) - (b.sort || 0);
      });

      const finalProduct = {
        ...updatedProduct,
        images: finalImages,
      };

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
      originalImagesRef.current = []; // Reset original images
      // Update product optimistically - will preserve scroll position
      onProductUpdated?.(finalProduct);
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
