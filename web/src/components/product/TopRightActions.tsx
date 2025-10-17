'use client';

import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';

export default function TopRightActions() {
  const { totalQty } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousQty, setPreviousQty] = useState(totalQty);

  // Trigger bounce animation when cart quantity increases
  useEffect(() => {
    if (totalQty > previousQty) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousQty(totalQty);
  }, [totalQty, previousQty]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="text-white hover:bg-white/10"
      >
        <Link href="/basket" aria-label="Корзина" className="relative">
          <ShoppingCartIcon
            className={`h-4 w-4 text-white transition-transform duration-300 ${
              isAnimating ? 'scale-110' : 'scale-100'
            }`}
            data-cart-icon
          />
          {totalQty > 0 && (
            <span
              className={`absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white transition-all duration-300 ${
                isAnimating ? 'scale-125 bg-green-500' : 'scale-100'
              }`}
            >
              {totalQty}
            </span>
          )}
        </Link>
      </Button>
    </div>
  );
}
