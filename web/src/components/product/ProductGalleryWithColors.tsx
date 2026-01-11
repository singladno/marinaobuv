'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import ColorSwitcher from '@/components/product/ColorSwitcher';
// import ProductGallery from '@/components/product/ProductGallery';
import ProductGalleryVertical from '@/components/product/ProductGalleryVertical';
import { useUser } from '@/contexts/NextAuthUserContext';

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
  onProductUpdated?: () => void;
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
  onProductUpdated,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialSelectedColor
  );
  const [togglingColors, setTogglingColors] = useState<Set<string>>(new Set());
  const [colorActiveStates, setColorActiveStates] = useState<Map<string, boolean>>(new Map());

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
        isActive: colorActiveStates.get(color) ?? true,
      }));
  }, [images, colorActiveStates]);

  const handleColorToggle = async (color: string, isActive: boolean) => {
    if (!productId || !isAdmin) return;

    // Optimistic update
    setTogglingColors(prev => new Set(prev).add(color));
    setColorActiveStates(prev => {
      const newMap = new Map(prev);
      newMap.set(color, isActive);
      return newMap;
    });

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/colors/${encodeURIComponent(color)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update color activation');
      }

      // Trigger product update callback to refresh data
      onProductUpdated?.();
      // Reload the page to get updated images
      router.refresh();
    } catch (error) {
      console.error('Error toggling color:', error);
      // Revert optimistic update on error
      setColorActiveStates(prev => {
        const newMap = new Map(prev);
        newMap.set(color, !isActive);
        return newMap;
      });
    } finally {
      setTogglingColors(prev => {
        const newSet = new Set(prev);
        newSet.delete(color);
        return newSet;
      });
    }
  };

  // Extract unique color names from images (independent of colorActiveStates)
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    return images
      .filter(img => !!img.color)
      .map(img => img.color as string)
      .filter(color => {
        const key = color.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [images]);

  // Fetch color active states on mount and when productId changes
  useEffect(() => {
    if (!productId || !isAdmin || uniqueColors.length === 0) return;

    // Fetch product with images to get color active states
    const fetchColorStates = async () => {
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          const states = new Map<string, boolean>();
          // Group images by color and check if any are active
          const colorGroups = new Map<string, boolean>();
          (data.product?.images || []).forEach((img: any) => {
            if (img.color) {
              const colorKey = img.color.toLowerCase();
              if (!colorGroups.has(colorKey)) {
                colorGroups.set(colorKey, false);
              }
              if (img.isActive) {
                colorGroups.set(colorKey, true);
              }
            }
          });
          colorGroups.forEach((isActive, color) => {
            // Find the original color name (case-sensitive) from uniqueColors
            const originalColor = uniqueColors.find(
              c => c.toLowerCase() === color
            );
            if (originalColor) {
              states.set(originalColor, isActive);
            }
          });
          setColorActiveStates(states);
        }
      } catch (error) {
        console.error('Error fetching color states:', error);
      }
    };

    fetchColorStates();
  }, [productId, isAdmin, uniqueColors]);

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
    // Read searchParams directly but don't include it in dependencies to avoid infinite loop
    const current = searchParams?.get('color') || null;
    if (effective && effective !== current) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('color', effective);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, colorOptions, router, pathname]);

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
            isAdmin={isAdmin}
            productId={productId}
            onColorToggle={handleColorToggle}
            togglingColors={togglingColors}
          />
        </div>
      )}
    </div>
  );
}
