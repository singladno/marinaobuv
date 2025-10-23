'use client';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import CartActionButton from '@/components/product/CartActionButton';
import ColorSwitcher from '@/components/product/ColorSwitcher';
import NoImagePlaceholder from '@/components/product/NoImagePlaceholder';
import { ProductSourceModal } from '@/components/product/ProductSourceModal';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { rub } from '@/lib/format';

// Function to get relative time in Russian
function getRelativeTime(dateString: string): string {
  // Only calculate on client side to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return 'Проверяется...';
  }

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Только что';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} дн. назад`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} мес. назад`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} г. назад`;
}

type Props = {
  slug: string;
  name: string;
  pricePair: number;
  // removed from DB; compute from sizes
  currency: string;
  imageUrl: string | null;
  category?: string;
  showCategory?: boolean;
  colorOptions?: Array<{ color: string; imageUrl: string }>;
  productId?: string; // Add productId for source button
  activeUpdatedAt?: string; // Add activeUpdatedAt for availability display
};

export default function ProductCard({
  slug,
  name,
  pricePair,
  // removed
  imageUrl,
  category,
  showCategory = false,
  colorOptions = [],
  productId,
  activeUpdatedAt,
}: Props) {
  const { user } = useUser();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
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
  const computedPairPrice = useMemo(() => pricePair ?? null, [pricePair]);
  return (
    <>
      <div className="bg-surface rounded-card-large shadow-card hover:shadow-card-hover group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1">
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

        <Link href={`/product/${slug}`} className="block flex-1">
          {/* Image Container */}
          <div className="bg-muted group/image relative aspect-square w-full overflow-hidden">
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

            {/* Source Chip - shows on hover (admin only) */}
            {user?.role === 'ADMIN' && productId && (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSourceModalOpen(true);
                }}
                className="absolute left-3 top-3 z-20 opacity-0 transition-all duration-200 group-hover:opacity-100"
                title="Просмотр источника сообщений"
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
                >
                  Источник
                </Badge>
              </button>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
          </div>

          <div className="space-y-3 p-5">
            <Text
              variant="body"
              className="text-foreground group-hover:text-primary line-clamp-2 min-h-[2.5rem] font-medium leading-tight transition-colors duration-200"
            >
              {name}
            </Text>
            <div className="flex items-center justify-between">
              <Text className="text-foreground text-xl font-bold">
                {rub(computedPairPrice ?? 0)}
              </Text>
              <CartActionButton
                slug={slug}
                productName={name}
                productImageUrl={displayImageUrl || undefined}
              />
            </div>
            <ColorSwitcher
              options={colorOptions}
              selectedColor={selectedColor || colorOptions[0]?.color || null}
              onSelect={setSelectedColor}
            />
          </div>
        </Link>

        {/* Availability info - positioned at the very bottom of the card */}
        {activeUpdatedAt && (
          <div className="px-5 pb-3 text-xs text-gray-500">
            Наличие проверено: {getRelativeTime(activeUpdatedAt)}
          </div>
        )}
      </div>

      {/* Source Modal - rendered outside card to avoid clipping (admin only) */}
      {user?.role === 'ADMIN' && productId && (
        <ProductSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          productId={productId}
          productName={name}
        />
      )}
    </>
  );
}
