import Link from 'next/link';

import { Button } from '@/components/ui/Button';

import { CartItem } from './CartItem';

interface CartItemWithProduct {
  slug: string;
  qty: number;
  color?: string | null;
  product: {
    id: string;
    name: string;
    pricePair: number;
    images: Array<{ url: string; alt?: string }>;
    category: { name: string };
    article?: string;
    sizes: Array<{ size: string; count: number }>;
  };
}

interface CartItemsListProps {
  items: CartItemWithProduct[];
  onRemove: (slug: string, color?: string | null) => void;
  onUpdateQuantity: (
    slug: string,
    quantity: number,
    color?: string | null
  ) => void;
  onToggleFavorite?: (slug: string) => void;
  favorites?: Set<string>;
  updatingItems?: Set<string>;
  removingItems?: Set<string>;
}

export function CartItemsList({
  items,
  onRemove,
  onUpdateQuantity,
  onToggleFavorite,
  favorites = new Set(),
  updatingItems = new Set(),
  removingItems = new Set(),
}: CartItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">Ваша корзина пуста</p>
        <Link href="/">
          <Button className="mt-4">Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <CartItem
          key={`${item.slug}::${item.color ?? ''}`}
          item={item}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favorites.has(item.slug)}
          isUpdating={updatingItems.has(`${item.slug}::${item.color ?? ''}`)}
          isRemoving={removingItems.has(`${item.slug}::${item.color ?? ''}`)}
        />
      ))}
    </div>
  );
}
