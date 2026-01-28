'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { ProductActions } from '@/components/product/ProductActions';
import { ProductFeatures } from '@/components/product/ProductFeatures';
import { ProductHeader } from '@/components/product/ProductHeader';
import { ProductPricing } from '@/components/product/ProductPricing';
import { Separator } from '@/components/ui/Separator';
import { useCart } from '@/contexts/CartContext';

// Sizes are now stored as an array of objects like [{size: '36', count: 1}, {size: '38', count: 2}]

type Props = {
  productId: string;
  slug: string;
  name: string;
  article?: string | null;
  pricePair: number;
  description?: string | null;
  material?: string | null;
  gender?: keyof typeof import('@/lib/format').genderRu | null;
  season?: keyof typeof import('@/lib/format').seasonRu | null;
  availabilityCheckedAt?: Date | string | null;
  sizes: Array<{ size: string; count: number }>; // Array of size objects like [{size: '36', count: 1}, {size: '38', count: 2}]
  sourceMessageIds?: string[] | null;
  imageUrl?: string; // Primary image URL for cart animations
  isActive: boolean;
  measurementUnit?: 'PAIRS' | 'PIECES';
};

export default function ProductDetails(props: Props) {
  const {
    productId,
    slug,
    name,
    article,
    pricePair,
    description,
    material,
    gender,
    season,
    sizes,
    sourceMessageIds,
    isActive,
  } = props;

  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const searchParams = useSearchParams();
  const selectedColor = (searchParams?.get('color') || '').trim() || null;
  const packPairs = useMemo(() => {
    if (!Array.isArray(sizes)) return null;
    return sizes.length > 0
      ? sizes.reduce((total, sizeObj) => total + sizeObj.count, 0)
      : null;
  }, [sizes]);
  const pairPrice = useMemo(
    () => (pricePair != null ? Number(pricePair) : null),
    [pricePair]
  );
  const boxPrice = useMemo(() => {
    if (pairPrice != null && packPairs != null && packPairs > 0)
      return Math.round(Number(pairPrice) * Number(packPairs));
    return null;
  }, [pairPrice, packPairs]);

  const handleAddToCart = () =>
    add(
      slug,
      quantity,
      {
        imageUrl: props.imageUrl || '',
        name: name,
      },
      selectedColor
    );
  const handleBuyNow = () =>
    add(
      slug,
      quantity,
      {
        imageUrl: props.imageUrl || '',
        name: name,
      },
      selectedColor
    );

  return (
    <div className="space-y-6">
      <ProductHeader
        name={name}
        article={article}
        gender={gender}
        season={season}
        slug={slug}
      />
      <Separator />
      <ProductPricing
        pricePair={pricePair}
        sizes={sizes}
        packPairs={packPairs}
        boxPrice={boxPrice}
        quantity={quantity}
        onQuantityChange={setQuantity}
        measurementUnit={props.measurementUnit}
      />
      <Separator />
      {description && (
        <div className="space-y-2">
          <h3 className="font-medium">Описание</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}
      <Separator />
      <ProductActions
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        productSlug={slug}
        productName={name}
        productImageUrl={props.imageUrl || undefined}
        isActive={isActive}
      />
      <Separator />
      <ProductFeatures
        material={material}
        gender={gender}
        season={season}
        packPairs={packPairs}
        measurementUnit={props.measurementUnit}
      />
    </div>
  );
}
