'use client';
/* eslint-disable max-lines */
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
import { useState } from 'react';

import ProductReviews from '@/components/product/ProductReviews';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { genderRu, rub, seasonRu } from '@/lib/format';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

type Props = {
  productId: string;
  name: string;
  article?: string | null;
  pricePair: number;
  description?: string | null;
  material?: string | null;
  gender?: keyof typeof genderRu | null;
  season?: keyof typeof seasonRu | null;
  packPairs?: number | null;
  priceBox?: number | null;
  availabilityCheckedAt?: Date | string | null;
  sizes: Size[];
};

export default function ProductDetails(props: Props) {
  const {
    productId,
    name,
    pricePair,
    description,
    material,
    gender,
    season,
    packPairs,
    sizes,
  } = props;

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Rating will be displayed in the reviews section

  // Initialize size selection
  if (!selectedSize && sizes.length > 0) {
    setSelectedSize(sizes[0].id);
  }

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { name, quantity, selectedSize });
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    console.log('Buy now:', { name, quantity, selectedSize });
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
              onClick={() => setIsWishlisted(!isWishlisted)}
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
        <div className="space-y-2">
          <div className="text-4xl font-bold">{rub(pricePair)}</div>
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
          <Button
            onClick={handleAddToCart}
            className="h-12 flex-1 gap-2 text-base font-medium"
          >
            <ShoppingCart className="h-5 w-5" />В корзину
          </Button>
          <Button
            variant="outline"
            onClick={handleBuyNow}
            className="h-12 px-8 text-base font-medium"
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
