'use client';

import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';

export default function TopRightActions() {
  const { totalQty } = useCart();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="text-white hover:bg-white/10"
      >
        <Link href="/basket" aria-label="Корзина" className="relative">
          <ShoppingCartIcon className="h-4 w-4 text-white" />
          {totalQty > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
              {totalQty}
            </span>
          )}
        </Link>
      </Button>
    </div>
  );
}
