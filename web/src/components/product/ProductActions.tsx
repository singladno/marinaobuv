'use client';

import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

type Props = {
  inCart: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
};

export function ProductActions({ inCart, onAddToCart, onBuyNow }: Props) {
  const router = useRouter();

  const handleBuyNow = () => {
    onBuyNow();
    router.push('/basket');
  };

  return (
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
          onClick={onAddToCart}
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
  );
}
