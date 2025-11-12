'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { type CategoryNode } from '@/components/ui/CategorySelector';
import { useCreateProductForm } from '@/hooks/useCreateProductForm';

import { CreateProductFormFields } from './CreateProductFormFields';
import { ProductImageUpload, type ImageFile } from './ProductImageUpload';

export type { ImageFile };

export interface CreateProductData {
  name: string;
  categoryId: string;
  pricePair: number;
  material: string;
  gender: 'FEMALE' | 'MALE';
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  description: string;
  sizes: Array<{ size: string; count: number }>;
  images?: ImageFile[];
}

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateProductData) => Promise<void>;
  categories: CategoryNode[];
  isLoading?: boolean;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onCreate,
  categories,
  isLoading = false,
}: CreateProductModalProps) {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    validate,
    prepareSubmitData,
    reset,
    clearError,
  } = useCreateProductForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validate()) {
      return;
    }

    // Validate images have colors
    const imagesWithoutColor = images.filter(img => !img.color.trim());
    if (imagesWithoutColor.length > 0) {
      setErrors({ submit: 'Укажите цвет для всех изображений' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = prepareSubmitData();
      // Include images in submit data
      const dataWithImages = { ...submitData, images };
      await onCreate(dataWithImages);
      reset();
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ submit: 'Не удалось создать товар. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      // Clean up image previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof CreateProductData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать товар"
      size="fullscreen"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
            {/* Images Section */}
            <ProductImageUpload
              images={images}
              onImagesChange={setImages}
              disabled={isSubmitting}
            />

            <CreateProductFormFields
              formData={formData}
              errors={errors}
              categories={categories}
              isSubmitting={isSubmitting}
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
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
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
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white"
            >
              {isSubmitting ? 'Создание...' : 'Создать товар'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
