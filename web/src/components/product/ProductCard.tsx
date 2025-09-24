import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import CartActionButton from '@/components/product/CartActionButton';
import ColorSwitcher from '@/components/product/ColorSwitcher';
import NoImagePlaceholder from '@/components/product/NoImagePlaceholder';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { rub } from '@/lib/format';

type Props = {
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  imageUrl: string | null;
  category?: string;
  showCategory?: boolean;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
};

export default function ProductCard({
  slug,
  name,
  pricePair,
  imageUrl,
  category,
  showCategory = false,
  colorOptions = [],
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  // keep cart context available if needed for future extensions
  const { add } = useCart();
  // Default to first color if exists so the active style is visible
  useEffect(() => {
    if (!selectedColor && colorOptions.length > 0) {
      setSelectedColor(colorOptions[0]?.color ?? null);
    }
  }, [selectedColor, colorOptions]);
  const displayImageUrl = useMemo(() => {
    const effectiveColor = selectedColor || (colorOptions[0]?.color ?? null);
    if (effectiveColor) {
      const found = colorOptions.find(
        o => o.color?.toLowerCase() === effectiveColor.toLowerCase()
      );
      if (found?.imageUrl) return found.imageUrl;
    }
    return imageUrl || null;
  }, [selectedColor, colorOptions, imageUrl]);
  const hasImage = displayImageUrl && displayImageUrl.trim() !== '';

  return (
    <div className="bg-surface group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* Heart overlay outside the Link to avoid navigation */}
      <button
        type="button"
        aria-label="Добавить в избранное"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(slug);
        }}
        className="absolute right-3 top-3 z-10 inline-flex cursor-pointer items-center justify-center text-white transition-transform hover:scale-110"
      >
        <Heart
          className={`h-5 w-5 ${isFavorite(slug) ? 'fill-red-500 text-red-500' : ''}`}
        />
      </button>

      <Link href={`/product/${slug}`} className="block">
        {/* Image Container */}
        <div className="bg-muted relative aspect-square w-full overflow-hidden">
          {hasImage ? (
            <Image
              src={displayImageUrl as string}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={false}
            />
          ) : (
            <NoImagePlaceholder />
          )}

          {/* Category Badge */}
          {showCategory && category && (
            <Badge
              variant="secondary"
              className="bg-background/90 absolute left-3 top-3 shadow-sm backdrop-blur-sm"
            >
              {category}
            </Badge>
          )}

          {/* Favorite overlay is rendered outside the Link */}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="space-y-3">
            <Text
              variant="body"
              className="text-foreground group-hover:text-primary line-clamp-2 min-h-[2.5rem] font-medium leading-tight transition-colors duration-200"
            >
              {name}
            </Text>

            <div className="flex items-center justify-between">
              <Text className="text-foreground text-xl font-bold">
                {rub(pricePair)}
              </Text>

              {/* Add to Cart / In Cart */}
              <div>
                <CartActionButton slug={slug} />
              </div>
            </div>

            <ColorSwitcher
              options={colorOptions}
              selectedColor={selectedColor || colorOptions[0]?.color || null}
              onSelect={setSelectedColor}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
