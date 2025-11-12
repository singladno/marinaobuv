'use client';

import { Text } from '@/components/ui/Text';

import { ProductImageUploadArea } from './ProductImageUploadArea';
import { ProductImageWithColor } from './ProductImageWithColor';

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
  color: string;
  isPrimary: boolean;
}

interface ProductImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function ProductImageUpload({
  images,
  onImagesChange,
  disabled = false,
  maxImages = 10,
}: ProductImageUploadProps) {
  const handleFileSelect = (files: FileList) => {
    const newImages: ImageFile[] = [];
    const remainingSlots = maxImages - images.length;
    const hasExistingPrimary = images.some(img => img.isPrimary);

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          newImages.push({
            file,
            preview,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            color: '',
            isPrimary: !hasExistingPrimary && images.length === 0 && index === 0,
          });
        }
      });

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  };

  const handleRemove = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const updatedImages = images.filter(img => img.id !== id);

    // If we removed the primary image and there are other images, make the first one primary
    if (imageToRemove?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    onImagesChange(updatedImages);
  };

  const handleSetPrimary = (id: string) => {
    onImagesChange(
      images.map(img => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleColorChange = (imageId: string, color: string) => {
    onImagesChange(
      images.map(img =>
        img.id === imageId ? { ...img, color } : img
      )
    );
  };

  return (
    <div className="space-y-3">
      <Text variant="body" className="font-medium text-gray-900 dark:text-white">
        Изображения товара
      </Text>

      <ProductImageUploadArea
        onFilesSelect={handleFileSelect}
        disabled={disabled}
        maxImages={maxImages}
        currentCount={images.length}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map(image => (
            <ProductImageWithColor
              key={image.id}
              image={image}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
              onColorChange={handleColorChange}
              disabled={disabled}
              hasError={!image.color.trim()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
