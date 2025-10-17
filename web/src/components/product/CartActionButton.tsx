'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { useCart } from '@/contexts/CartContext';

interface CartActionButtonProps {
  slug: string;
  productName?: string;
  productImageUrl?: string;
}

export default function CartActionButton({
  slug,
  productName,
  productImageUrl,
}: CartActionButtonProps) {
  const router = useRouter();
  const { add, items } = useCart();
  const inCart = useMemo(() => items.some(i => i.slug === slug), [items, slug]);

  if (inCart) {
    return (
      <button
        title="В корзине"
        aria-label="В корзине"
        onClick={e => {
          e.preventDefault();
          router.push('/basket');
        }}
        className="h-8 cursor-pointer rounded-full bg-violet-100 px-3 text-xs font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-600 hover:text-white"
      >
        В корзине
      </button>
    );
  }

  return (
    <button
      title="Добавить"
      aria-label="Добавить"
      data-product-slug={slug}
      onClick={e => {
        e.preventDefault();
        add(slug, 1, {
          imageUrl: productImageUrl || '',
          name: productName || '',
        });
      }}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm transition-colors hover:bg-black hover:text-white"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="21" r="1"></circle>
        <circle cx="19" cy="21" r="1"></circle>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
      </svg>
    </button>
  );
}
