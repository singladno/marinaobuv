'use client';

import { useMemo } from 'react';

import { Text } from '@/components/ui/Text';

import { ProductImageUploadArea } from './ProductImageUploadArea';
import { ProductImageColorGroup } from './ProductImageColorGroup';

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
  color: string;
  isPrimary: boolean;
  isDeleted?: boolean;
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
    // Count only non-deleted images for remaining slots
    const activeImages = images.filter(img => !img.isDeleted);
    const remainingSlots = maxImages - activeImages.length;

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          newImages.push({
            file,
            preview,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            color: '',
            isPrimary: false, // Primary will be set per color group when color is assigned
            isDeleted: false,
          });
        }
      });

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  };

  const handleRemove = async (id: string) => {
    const imageToMarkDeleted = images.find(img => img.id === id);
    if (!imageToMarkDeleted) return;

    // Mark image as deleted instead of removing it
    const updatedImages = images.map(img =>
      img.id === id ? { ...img, isDeleted: true, isPrimary: false } : img
    );

    // If this is an existing image (has URL), immediately update isActive status in the database
    if (imageToMarkDeleted.preview.startsWith('http') && imageToMarkDeleted.id) {
      try {
        const response = await fetch(
          `/api/admin/products/images/${imageToMarkDeleted.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: false }),
          }
        );
        if (!response.ok) {
          console.error(`Failed to deactivate image ${imageToMarkDeleted.id}`);
        }
      } catch (error) {
        console.error(`Error deactivating image ${imageToMarkDeleted.id}:`, error);
      }
    }

    // If we deleted the primary image and there are other active images, make the first active one primary
    if (imageToMarkDeleted.isPrimary) {
      const activeImages = updatedImages.filter(img => !img.isDeleted);
      if (activeImages.length > 0) {
        activeImages[0].isPrimary = true;
        const primaryId = activeImages[0].id;
        onImagesChange(
          updatedImages.map(img =>
            img.id === primaryId ? { ...img, isPrimary: true } : img
          )
        );
        return;
      }
    }

    onImagesChange(updatedImages);
  };

  const handleRestore = async (id: string) => {
    const imageToRestore = images.find(img => img.id === id);
    if (!imageToRestore) return;

    // If this is an existing image (has URL), immediately update isActive status in the database
    if (imageToRestore.preview.startsWith('http') && imageToRestore.id) {
      try {
        const response = await fetch(
          `/api/admin/products/images/${imageToRestore.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: true }),
          }
        );
        if (!response.ok) {
          console.error(`Failed to activate image ${imageToRestore.id}`);
        }
      } catch (error) {
        console.error(`Error activating image ${imageToRestore.id}:`, error);
      }
    }

    onImagesChange(
      images.map(img => (img.id === id ? { ...img, isDeleted: false } : img))
    );
  };

  const handleSetPrimary = (id: string) => {
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) return;

    // Set primary for the same color group only
    const targetColor = targetImage.color.trim().toLowerCase();
    onImagesChange(
      images.map(img => {
        const imgColor = img.color.trim().toLowerCase();
        // Only set primary if it's in the same color group
        if (imgColor === targetColor && !img.isDeleted) {
          return {
            ...img,
            isPrimary: img.id === id,
          };
        }
        // Clear primary for other images in the same color group
        if (imgColor === targetColor && img.id !== id) {
          return {
            ...img,
            isPrimary: false,
          };
        }
        return img;
      })
    );
  };

  const handleColorChange = (imageId: string, color: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const oldColor = image.color.trim().toLowerCase();
    const newColor = color.trim().toLowerCase();

    // Check if the new color group already has a primary image
    const newColorGroup = images.filter(
      img => img.color.trim().toLowerCase() === newColor && !img.isDeleted && img.id !== imageId
    );
    const hasPrimaryInNewGroup = newColorGroup.some(img => img.isPrimary);

    onImagesChange(
      images.map(img => {
        if (img.id === imageId) {
          // If moving to a new color group and this was primary, clear primary
          // If the new color group doesn't have a primary, make this one primary
          const shouldBePrimary = oldColor !== newColor && !hasPrimaryInNewGroup && !!newColor;
          return {
            ...img,
            color,
            isPrimary: oldColor === newColor ? img.isPrimary : shouldBePrimary,
          };
        }
        // Clear primary for other images in the old color group if this was primary
        if (oldColor && img.color.trim().toLowerCase() === oldColor && image.isPrimary && img.id !== imageId) {
          return {
            ...img,
            isPrimary: false,
          };
        }
        return img;
      })
    );
  };

  // Group images by color
  const groupedImages = useMemo(() => {
    // Group all images by color (including deleted ones)
    const colorGroups = new Map<string, ImageFile[]>();
    const unassigned: ImageFile[] = [];

    images.forEach(img => {
      const color = img.color.trim();
      if (color) {
        const key = color.toLowerCase();
        if (!colorGroups.has(key)) {
          colorGroups.set(key, []);
        }
        colorGroups.get(key)!.push(img);
      } else {
        unassigned.push(img);
      }
    });

    // Sort color groups alphabetically
    const sortedGroups = Array.from(colorGroups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    // Add unassigned group if there are any
    if (unassigned.length > 0) {
      sortedGroups.push(['', unassigned]);
    }

    return sortedGroups;
  }, [images]);

  return (
    <div className="space-y-3">
      <Text variant="body" className="font-medium text-gray-900 dark:text-white">
        Изображения товара
      </Text>

      <ProductImageUploadArea
        onFilesSelect={handleFileSelect}
        disabled={disabled}
        maxImages={maxImages}
        currentCount={images.filter(img => !img.isDeleted).length}
      />

      {groupedImages.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {groupedImages.map(([colorKey, colorImages]) => (
            <ProductImageColorGroup
              key={colorKey || '__unassigned__'}
              color={colorKey || ''}
              images={colorImages}
              onRemove={handleRemove}
              onRestore={handleRestore}
              onSetPrimary={handleSetPrimary}
              onColorChange={handleColorChange}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
