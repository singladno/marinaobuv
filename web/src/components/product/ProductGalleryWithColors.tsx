'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import ColorSwitcher from '@/components/product/ColorSwitcher';
// import ProductGallery from '@/components/product/ProductGallery';
import ProductGalleryVertical from '@/components/product/ProductGalleryVertical';

type ImageWithColor = { url: string; alt?: string; color?: string | null };
type Video = { id: string; url: string; alt?: string; sort: number; duration?: number };

type Props = {
  images: ImageWithColor[];
  videos?: Video[];
  productName: string;
  productId?: string;
  sourceMessageIds?: string[] | null;
  sourceScreenshotUrl?: string | null;
  isActive: boolean;
  source?: 'WA' | 'AG' | 'MANUAL';
  initialSelectedColor?: string | null;
};

export default function ProductGalleryWithColors({
  images,
  videos = [],
  productName,
  productId,
  sourceMessageIds,
  sourceScreenshotUrl,
  isActive,
  source,
  initialSelectedColor = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialSelectedColor
  );

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

  // Keep URL `color` in sync for other components (e.g., ProductDetails)
  useEffect(() => {
    const effective = selectedColor || colorOptions[0]?.color || null;
    const current = searchParams?.get('color') || null;
    if (effective && effective !== current) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('color', effective);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [selectedColor, colorOptions, router, pathname, searchParams]);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <ProductGalleryVertical
          images={filteredImages}
          videos={videos}
          productName={productName}
          height={560}
          productId={productId}
          sourceMessageIds={sourceMessageIds}
          sourceScreenshotUrl={sourceScreenshotUrl}
          isActive={isActive}
          source={source}
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
