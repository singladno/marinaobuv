'use client';

import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { type CategoryNode } from '@/components/ui/CategorySelector';
import { useEditProductForm } from '@/hooks/useEditProductForm';
import { useUpdateProduct } from '@/hooks/useUpdateProduct';
import { useUploadProductImages } from '@/hooks/useUploadProductImages';

import { CreateProductFormFields } from './CreateProductFormFields';
import { ProductImageUpload, type ImageFile } from './ProductImageUpload';
import { ProductImageUploadArea } from './ProductImageUploadArea';
import { ProductVideoUpload, type VideoFile } from './ProductVideoUpload';
import { useUploadProductVideos } from '@/hooks/useUploadProductVideos';
import Image from 'next/image';
import { Text } from '@/components/ui/Text';
import type { CreateProductData } from './CreateProductModal';

export type { ImageFile };

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  categories: CategoryNode[];
  categoriesLoading?: boolean;
  onProductUpdated?: (updatedProduct: any) => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  productId,
  categories,
  categoriesLoading = false,
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
    videos,
    setVideos,
    loading: loadingProduct,
    sourceScreenshotUrl: existingSourceScreenshotUrl,
  } = useEditProductForm(productId, isOpen);
  const { updateProduct, isLoading: isUpdating } = useUpdateProduct();
  const { uploadImages } = useUploadProductImages();
  const { uploadVideos } = useUploadProductVideos();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const originalImagesRef = useRef<ImageFile[]>([]);
  const originalVideosRef = useRef<VideoFile[]>([]);
  const [sourceScreenshot, setSourceScreenshot] = useState<File | null>(null);
  const [sourceScreenshotPreview, setSourceScreenshotPreview] = useState<
    string | null
  >(null);

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

  // Store original videos when they're loaded
  useEffect(() => {
    if (
      !loadingProduct &&
      videos.length > 0 &&
      originalVideosRef.current.length === 0
    ) {
      originalVideosRef.current = JSON.parse(JSON.stringify(videos));
    }
  }, [loadingProduct, videos]);

  // Reset source screenshot when modal closes
  useEffect(() => {
    if (!productId) {
      setSourceScreenshot(null);
      setSourceScreenshotPreview(null);
    }
  }, [productId]);

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
      originalVideosRef.current = []; // Reset when modal closes
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
      const updatedProduct = await updateProduct(productId, submitData);

      // Upload source screenshot if a new one was selected
      if (sourceScreenshot) {
        try {
          const formData = new FormData();
          formData.append('file', sourceScreenshot);
          const response = await fetch(
            `/api/admin/products/${productId}/source-screenshot`,
            {
              method: 'POST',
              body: formData,
            }
          );
          if (!response.ok) {
            console.error('Failed to upload source screenshot');
          }
        } catch (screenshotError) {
          console.error('Error uploading source screenshot:', screenshotError);
        }
      }

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
        try {
          // Upload new images
          await uploadImages(productId, newImages);

          // Fetch the updated product to get all images with proper IDs
          const productResponse = await fetch(
            `/api/admin/products/${productId}`
          );
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const allProductImages = productData.product?.images || [];

            // Get IDs of images that were deleted in the UI
            const deletedImageIds = new Set(
              images.filter(img => img.isDeleted && img.id).map(img => img.id)
            );

            // Filter to only include active images (not deleted in UI)
            const updatedFinalImages = allProductImages.filter((img: any) => {
              // Exclude if it was marked as deleted in the UI
              if (deletedImageIds.has(img.id)) {
                return false;
              }
              // Include all active images from the API
              return img.isActive !== false;
            });

            // Sort by isPrimary desc, then sort asc
            updatedFinalImages.sort((a: any, b: any) => {
              if (a.isPrimary && !b.isPrimary) return -1;
              if (!a.isPrimary && b.isPrimary) return 1;
              return (a.sort || 0) - (b.sort || 0);
            });

            finalProduct.images = updatedFinalImages;
          }
        } catch (error) {
          console.error('Error uploading new images:', error);
          setErrors({
            submit:
              'Не удалось загрузить новые изображения. Попробуйте еще раз.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Handle video deletions and updates
      const activeVideos = videos.filter(video => !video.isDeleted);
      const originalVideos = originalVideosRef.current;
      const originalVideoMap = new Map(
        originalVideos.map(video => [video.id, video])
      );

      // Update video metadata for existing videos
      const videosToUpdate = activeVideos
        .filter(video => video.preview.startsWith('http') && video.id)
        .map(video => {
          const original = originalVideoMap.get(video.id);
          if (!original) return null;

          const wasDeleted = original.isDeleted;
          const isNowActive = !video.isDeleted;

          if (wasDeleted === video.isDeleted) {
            return null; // No change
          }

          return {
            video,
            wasDeleted,
            isNowActive,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Update videos that changed
      await Promise.all(
        videosToUpdate.map(async ({ video, isNowActive }) => {
          try {
            const response = await fetch(
              `/api/admin/products/videos/${video.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: isNowActive }),
              }
            );
            if (!response.ok) {
              console.error(`Failed to update video ${video.id}`);
            }
          } catch (error) {
            console.error(`Error updating video ${video.id}:`, error);
          }
        })
      );

      // Handle new video uploads
      const newVideos = activeVideos.filter(
        video => !video.preview.startsWith('http')
      );
      if (newVideos.length > 0) {
        try {
          await uploadVideos(productId, newVideos);

          // Fetch the updated product to get all videos with proper IDs
          const productResponse = await fetch(
            `/api/admin/products/${productId}`
          );
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const allProductVideos = productData.product?.videos || [];

            // Get IDs of videos that were deleted in the UI
            const deletedVideoIds = new Set(
              videos
                .filter(video => video.isDeleted && video.id)
                .map(video => video.id)
            );

            // Filter to only include active videos (not deleted in UI)
            const updatedFinalVideos = allProductVideos.filter((video: any) => {
              if (deletedVideoIds.has(video.id)) {
                return false;
              }
              return video.isActive !== false;
            });

            // Sort by sort asc
            updatedFinalVideos.sort(
              (a: any, b: any) => (a.sort || 0) - (b.sort || 0)
            );

            finalProduct.videos = updatedFinalVideos;
          }
        } catch (error) {
          console.error('Error uploading new videos:', error);
          setErrors({
            submit: 'Не удалось загрузить новые видео. Попробуйте еще раз.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      reset();
      setImages([]);
      videos.forEach(video => {
        if (video.preview.startsWith('blob:')) {
          URL.revokeObjectURL(video.preview);
        }
      });
      setVideos([]);
      originalImagesRef.current = []; // Reset original images
      originalVideosRef.current = []; // Reset original videos
      if (sourceScreenshotPreview) {
        URL.revokeObjectURL(sourceScreenshotPreview);
      }
      setSourceScreenshot(null);
      setSourceScreenshotPreview(null);
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
      // Clean up video previews
      videos.forEach(video => {
        if (video.preview.startsWith('blob:')) {
          URL.revokeObjectURL(video.preview);
        }
      });
      setVideos([]);
      // Clean up source screenshot preview
      if (sourceScreenshotPreview) {
        URL.revokeObjectURL(sourceScreenshotPreview);
      }
      setSourceScreenshot(null);
      setSourceScreenshotPreview(null);
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
                className="mx-auto max-w-4xl space-y-4 sm:space-y-6"
                onSubmit={handleSubmit}
              >
                {/* Images Section */}
                <ProductImageUpload
                  images={images}
                  onImagesChange={setImages}
                  disabled={isSubmitting || isUpdating}
                />

                {/* Videos Section */}
                <ProductVideoUpload
                  videos={videos}
                  onVideosChange={setVideos}
                  disabled={isSubmitting || isUpdating}
                />

                {/* Source Screenshot Section */}
                <div className="space-y-2">
                  <Text
                    variant="body"
                    className="font-medium text-gray-900 dark:text-white"
                  >
                    Скриншот исходного сообщения (опционально)
                  </Text>
                  {existingSourceScreenshotUrl && !sourceScreenshotPreview ? (
                    <div className="relative inline-block">
                      <Image
                        src={existingSourceScreenshotUrl}
                        alt="Existing source screenshot"
                        width={128}
                        height={128}
                        className="h-32 w-auto rounded-lg border object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Optionally delete from server
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600"
                        disabled={isSubmitting || isUpdating}
                        aria-label="Удалить скриншот"
                        title="Удалить скриншот"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : !sourceScreenshotPreview ? (
                    <ProductImageUploadArea
                      onFilesSelect={files => {
                        const file = files?.[0];
                        if (file) {
                          setSourceScreenshot(file);
                          setSourceScreenshotPreview(URL.createObjectURL(file));
                        }
                      }}
                      disabled={isSubmitting || isUpdating}
                      maxImages={1}
                      currentCount={0}
                    />
                  ) : (
                    <div className="relative inline-block">
                      <Image
                        src={sourceScreenshotPreview}
                        alt="Source screenshot preview"
                        width={128}
                        height={128}
                        className="h-32 w-auto rounded-lg border object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (sourceScreenshotPreview) {
                            URL.revokeObjectURL(sourceScreenshotPreview);
                          }
                          setSourceScreenshot(null);
                          setSourceScreenshotPreview(null);
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600"
                        disabled={isSubmitting || isUpdating}
                        aria-label="Удалить скриншот"
                        title="Удалить скриншот"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <CreateProductFormFields
                  formData={formData}
                  errors={errors}
                  categories={categories}
                  isSubmitting={isSubmitting || isUpdating || !formReady}
                  onFieldChange={handleFieldChange}
                  onClearError={clearError}
                  isEditMode={true}
                />

                {/* Error message */}
                {errors.submit && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {errors.submit}
                  </div>
                )}

                {/* Fixed Footer with Action Buttons */}
                <div className="-mx-4 -mb-4 flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
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
                      disabled={isSubmitting || isUpdating || loadingProduct}
                      className="w-full !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white sm:w-auto"
                    >
                      {isSubmitting || isUpdating
                        ? 'Сохранение...'
                        : 'Сохранить изменения'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
