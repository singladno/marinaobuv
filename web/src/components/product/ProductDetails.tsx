'use client';
// /* eslint-disable max-lines */
import {
  ShoppingCart,
  Minus,
  Plus,
  Share,
  Heart,
  User,
  Users,
  Package,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import ProductReviews from '@/components/product/ProductReviews';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { genderRu, rub, seasonRu } from '@/lib/format';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

type Props = {
  productId: string;
  slug: string;
  name: string;
  article?: string | null;
  pricePair: number;
  description?: string | null;
  material?: string | null;
  gender?: keyof typeof genderRu | null;
  season?: keyof typeof seasonRu | null;
  // removed from DB; compute from sizes
  availabilityCheckedAt?: Date | string | null;
  sizes: Size[];
};

export default function ProductDetails(props: Props) {
  const {
    productId,
    slug,
    name,
    pricePair,
    description,
    material,
    gender,
    season,
    sizes,
  } = props;

  const router = useRouter();
  const { add, items } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Check if product is in cart
  const inCart = useMemo(() => items.some(i => i.slug === slug), [items, slug]);
  const packPairs = useMemo(() => {
    if (!Array.isArray(sizes)) return null;
    const total = sizes.reduce((sum, s) => sum + Number(s.stock ?? 0), 0);
    return total > 0 ? total : null;
  }, [sizes]);
  const pairPrice = useMemo(() => {
    return pricePair != null ? Number(pricePair) : null;
  }, [pricePair]);
  const boxPrice = useMemo(() => {
    if (pairPrice != null && packPairs != null && packPairs > 0)
      return Math.round(Number(pairPrice) * Number(packPairs));
    return null;
  }, [pairPrice, packPairs]);
  const isWishlisted = isFavorite(slug);

  // Initialize size selection
  if (!selectedSize && sizes.length > 0) {
    setSelectedSize(sizes[0].id);
  }

  const handleAddToCart = () => {
    add(slug, quantity);
  };

  const handleBuyNow = () => {
    add(slug, quantity);
    router.push('/basket');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs font-medium">
              Обувь
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(slug)}
              aria-label="Добавить в избранное"
            >
              <Heart
                className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-bold">{rub(pairPrice ?? 0)}</div>
          </div>
          {boxPrice != null && (
            <div className="text-muted-foreground text-sm">
              {rub(boxPrice)} за коробку{packPairs ? ` (${packPairs} пар)` : ''}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Description */}
      {description && (
        <div className="space-y-3">
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium">Размеры</h3>
            <div className="flex flex-wrap gap-2">
              {sizes
                .sort((a, b) => parseInt(a.size) - parseInt(b.size))
                .map(size => (
                  <div key={size.id} className="flex flex-col items-center">
                    <div className="bg-muted/50 flex h-16 w-16 flex-col items-center justify-center rounded-md border">
                      <span className="text-lg font-medium">{size.size}</span>
                      <span className="text-muted-foreground text-xs">
                        {size.stock || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div className="space-y-3">
          <h3 className="font-medium">Количество</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-r-none"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] px-4 py-2 text-center font-medium">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-l-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-muted-foreground text-sm">В наличии</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {inCart ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/basket')}
              className="flex-1 gap-2"
            >
              <ShoppingCart className="h-5 w-5" />В корзине
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              className="flex-1 gap-2"
            >
              <ShoppingCart className="h-5 w-5" />В корзину
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={handleBuyNow}
            className="px-8"
          >
            Купить сейчас
          </Button>
        </div>
      </div>

      <Separator />

      {/* Key Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ключевые особенности</h3>
        <div className="grid grid-cols-2 gap-4">
          {material && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Материал</p>
                <p className="text-sm font-medium">{material}</p>
              </div>
            </div>
          )}
          {gender && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                {gender === 'female' ? (
                  <User className="h-4 w-4 text-pink-600" />
                ) : (
                  <Users className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Пол</p>
                <p className="text-sm font-medium">{genderRu[gender]}</p>
              </div>
            </div>
          )}
          {season && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Сезон</p>
                <p className="text-sm font-medium">{seasonRu[season]}</p>
              </div>
            </div>
          )}
          {packPairs != null && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Пар в коробке</p>
                <p className="text-sm font-medium">{packPairs}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Reviews Section */}
      <ProductReviews productId={productId} />
    </div>
  );
}
