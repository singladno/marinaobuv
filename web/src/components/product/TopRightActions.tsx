'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function TopRightActions() {
  const { totalQty } = useCart();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/cart"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700"
        aria-label="Корзина"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.44A1.994 1.994 0 0 0 10 19h10v-2H10.42c-.14 0-.25-.11-.25-.25l.03-.12L11.1 15h7.45a2 2 0 0 0 1.79-1.11l3.24-6.49A1 1 0 0 0 22.68 6H6.31l-.94-2Zm3 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
        {totalQty > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
            {totalQty}
          </span>
        )}
      </Link>
    </div>
  );
}
