import Link from 'next/link';

import { Button } from '@/components/ui/Button';

import { CartItem } from './CartItem';

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: {
    id: string;
    name: string;
    pricePair: number;
    images: Array<{ url: string; alt?: string }>;
    category: { name: string };
    article?: string;
  };
}

interface CartItemsListProps {
  items: CartItemWithProduct[];
  onRemove: (slug: string) => void;
  onUpdateQuantity: (slug: string, quantity: number) => void;
}

export function CartItemsList({
  items,
  onRemove,
  onUpdateQuantity,
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
          key={item.product.id}
          item={item}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
        />
      ))}
    </div>
  );
}
