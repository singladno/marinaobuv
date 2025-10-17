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
};

export function ProductActions({
  onAddToCart,
  onBuyNow,
  productSlug,
  productName,
  productImageUrl,
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
      >
        <ShoppingCart className="h-5 w-5" />
        Купить
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={handleBuyNow}
        className="gap-2 border-2 border-violet-200 px-8 font-semibold text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50"
      >
        <Zap className="h-5 w-5" />В корзину
      </Button>
    </div>
  );
}
