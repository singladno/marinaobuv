'use client';

import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useEditProductForm } from '@/hooks/useEditProductForm';

import { ProductImageUpload, type ImageFile } from './ProductImageUpload';

interface EditProductImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onProductUpdated?: (updatedProduct: any) => void;
}

export function EditProductImagesModal({
  isOpen,
  onClose,
  productId,
  onProductUpdated,
}: EditProductImagesModalProps) {
  const {
    images,
    setImages,
    loading: loadingProduct,
  } = useEditProductForm(productId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const originalImagesRef = useRef<ImageFile[]>([]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset original images ref when modal closes
      originalImagesRef.current = [];
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      return;
    }

    // Validate images have colors (only for new images)
    const activeImages = images.filter(img => !img.isDeleted);
    const newImages = activeImages.filter(
      img => !img.preview.startsWith('http')
    );
    const imagesWithoutColor = newImages.filter(img => !img.color.trim());
    if (imagesWithoutColor.length > 0) {
      alert('Укажите цвет для всех новых изображений');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update image metadata (isPrimary, sort, color) only for images that changed
      const originalImages = originalImagesRef.current;
      const originalImageMap = new Map(
        originalImages.map(img => [img.id, img])
      );

      // Find images that actually changed
      const originalActiveImages = originalImages.filter(img => !img.isDeleted);

      const imagesToUpdate = activeImages
        .filter(img => img.preview.startsWith('http') && img.id) // Only existing images
        .map((img, newIndex) => {
          const original = originalImageMap.get(img.id);
          if (!original) {
            return null;
          }

          // Check if anything changed
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

          return {
            img,
            colorChanged,
            isPrimaryChanged,
            wasDeleted,
            isNowActive,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Update only changed images
      const imagesWithPayloads = imagesToUpdate
        .map(({ img, colorChanged, wasDeleted, isNowActive }) => {
          const updatePayload: any = {};

          if (colorChanged) {
            updatePayload.color = img.color || null;
          }
          if (wasDeleted && isNowActive) {
            updatePayload.isActive = true;
          }

          if (Object.keys(updatePayload).length === 0) {
            return null;
          }

          return { img, updatePayload, isPrimary: img.isPrimary };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Send requests for images with actual changes
      await Promise.all(
        imagesWithPayloads.map(async ({ img, updatePayload }) => {
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
            }
          } catch (error) {
            console.error(`Error updating image ${img.id}:`, error);
          }
        })
      );

      // Set isPrimary for the primary image if it changed
      const primaryImage = activeImages.find(
        img => img.isPrimary && img.preview.startsWith('http') && img.id
      );
      const originalPrimaryImage = originalImages.find(
        img => img.isPrimary && !img.isDeleted
      );

      if (
        primaryImage &&
        (!originalPrimaryImage || originalPrimaryImage.id !== primaryImage.id)
      ) {
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
          if (!response.ok) {
            console.error(`Failed to set primary image ${primaryImage.id}`);
          }
        } catch (error) {
          console.error(
            `Error setting primary image ${primaryImage.id}:`,
            error
          );
        }
      }

      // Handle new image uploads if there are any
      const newImages = activeImages.filter(
        img => !img.preview.startsWith('http')
      );
      if (newImages.length > 0) {
        // TODO: Implement new image upload logic if needed
        console.log('New images to upload:', newImages.length);
      }

      // Reload products list to show updated images
      originalImagesRef.current = []; // Reset original images
      onProductUpdated?.({ id: productId } as any);
      onClose();
    } catch (error) {
      console.error('Error updating images:', error);
      alert('Не удалось обновить изображения. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Clean up image previews
      images.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      originalImagesRef.current = []; // Reset original images
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Редактировать изображения"
      size="fullscreen"
    >
      <div className="flex h-full flex-col overflow-hidden">
        {loadingProduct ? (
          <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">
                Загрузка изображений...
              </span>
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
                  disabled={isSubmitting}
                />
              </form>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto flex max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || loadingProduct}
                  className="w-full !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white sm:w-auto"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
