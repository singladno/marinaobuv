'use client';

import { ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

type Props = {
  onAddToCart: () => void;
  onBuyNow: () => void;
  productSlug?: string;
  productName?: string;
  productImageUrl?: string;
  isActive: boolean;
};

export function ProductActions({
  onAddToCart,
  onBuyNow,
  productSlug,
  productName,
  productImageUrl,
  isActive,
}: Props) {
  const router = useRouter();

  const handleBuyNow = () => {
    onBuyNow();
    router.push('/basket');
  };

  return (
    <div className="flex gap-3">
      <Button
        variant="primary"
        size="lg"
        onClick={onAddToCart}
        className="flex-1 gap-2"
        data-add-to-cart
        data-product-slug={productSlug}
        disabled={!isActive}
        title={!isActive ? 'Товар недоступен' : undefined}
      >
        <ShoppingCart className="h-5 w-5" />
        Купить
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={handleBuyNow}
        className="gap-2 border-2 border-violet-200 px-8 font-semibold text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50"
        disabled={!isActive}
        title={!isActive ? 'Товар недоступен' : undefined}
      >
        <Zap className="h-5 w-5" />В корзину
      </Button>
    </div>
  );
}
