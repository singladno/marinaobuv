'use client';
import { useState } from 'react';

import {
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Share,
  Truck,
} from 'lucide-react';

import ProductSizes from '@/components/product/ProductSizes';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { genderRu, rub, seasonRu } from '@/lib/format';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

type Props = {
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
    name,
    article,
    pricePair,
    description,
    material,
    gender,
    season,
    packPairs,
    priceBox,
    availabilityCheckedAt,
    sizes,
  } = props;

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Mock rating for now - in real app this would come from props
  const rating = 4.5;
  const reviewCount = 127;

  // Initialize size selection
  if (!selectedSize && sizes.length > 0) {
    setSelectedSize(sizes[0].id);
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="h-4 w-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

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

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">{renderStars(rating)}</div>
          <span className="text-sm font-medium">{rating}</span>
          <span className="text-muted-foreground text-sm">
            ({reviewCount} отзывов)
          </span>
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
        <ul className="space-y-2">
          {material && (
            <li className="flex items-start gap-2 text-sm">
              <div className="bg-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>Материал: {material}</span>
            </li>
          )}
          {gender && (
            <li className="flex items-start gap-2 text-sm">
              <div className="bg-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>Пол: {genderRu[gender]}</span>
            </li>
          )}
          {season && (
            <li className="flex items-start gap-2 text-sm">
              <div className="bg-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>Сезон: {seasonRu[season]}</span>
            </li>
          )}
          {packPairs != null && (
            <li className="flex items-start gap-2 text-sm">
              <div className="bg-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>Пар в коробке: {packPairs}</span>
            </li>
          )}
        </ul>
      </div>

      {/* Sizes */}
      <ProductSizes sizes={sizes} />
    </div>
  );
}
