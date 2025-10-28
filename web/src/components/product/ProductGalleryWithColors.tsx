'use client';

import { useMemo, useState } from 'react';

import ColorSwitcher from '@/components/product/ColorSwitcher';
// import ProductGallery from '@/components/product/ProductGallery';
import ProductGalleryVertical from '@/components/product/ProductGalleryVertical';

type ImageWithColor = { url: string; alt?: string; color?: string | null };

type Props = {
  images: ImageWithColor[];
  productName: string;
  productId?: string;
  sourceMessageIds?: string[] | null;
  isActive: boolean;
};

export default function ProductGalleryWithColors({
  images,
  productName,
  productId,
  sourceMessageIds,
  isActive,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const colorOptions = useMemo(() => {
    const seen = new Set<string>();
    return images
      .filter(img => !!img.color)
      .map(img => img.color as string)
      .filter(color => {
        const key = color.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(color => ({
        color,
        imageUrl:
          images.find(i => i.color?.toLowerCase() === color.toLowerCase())
            ?.url || '',
      }));
  }, [images]);

  const filteredImages = useMemo(() => {
    const effectiveColor = selectedColor || colorOptions[0]?.color || null;
    if (effectiveColor) {
      const subset = images.filter(
        i => i.color && i.color.toLowerCase() === effectiveColor.toLowerCase()
      );
      if (subset.length > 0) return subset;
    }
    return images;
  }, [selectedColor, colorOptions, images]);

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <ProductGalleryVertical
          images={filteredImages}
          productName={productName}
          height={560}
          productId={productId}
          sourceMessageIds={sourceMessageIds}
          isActive={isActive}
        />
      </div>
      {colorOptions.length > 1 && (
        <div className="flex h-[560px] items-center">
          <ColorSwitcher
            options={colorOptions}
            selectedColor={selectedColor || colorOptions[0]?.color || null}
            onSelect={setSelectedColor}
            direction="col"
          />
        </div>
      )}
    </div>
  );
}
