'use client';

import { useState, useMemo } from 'react';

import { ProductActions } from '@/components/product/ProductActions';
import { ProductFeatures } from '@/components/product/ProductFeatures';
import { ProductHeader } from '@/components/product/ProductHeader';
import { ProductPricing } from '@/components/product/ProductPricing';
import ProductReviews from '@/components/product/ProductReviews';
import { Separator } from '@/components/ui/Separator';
import { useCart } from '@/contexts/CartContext';

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
  gender?: keyof typeof import('@/lib/format').genderRu | null;
  season?: keyof typeof import('@/lib/format').seasonRu | null;
  availabilityCheckedAt?: Date | string | null;
  sizes: Size[];
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
  } = props;

  const { add, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const inCart = useMemo(() => items.some(i => i.slug === slug), [items, slug]);
  const packPairs = useMemo(() => {
    if (!Array.isArray(sizes)) return null;
    const total = sizes.reduce((sum, s) => sum + Number(s.stock ?? 0), 0);
    return total > 0 ? total : null;
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

  if (!selectedSize && sizes.length > 0) {
    setSelectedSize(sizes[0].id);
  }

  const handleAddToCart = () => add(slug, quantity);
  const handleBuyNow = () => add(slug, quantity);

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
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
        quantity={quantity}
        onQuantityChange={setQuantity}
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
        inCart={inCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
      <Separator />
      <ProductFeatures
        material={material}
        gender={gender}
        season={season}
        packPairs={packPairs}
      />
      <Separator />
      <ProductReviews productId={productId} />
    </div>
  );
}
