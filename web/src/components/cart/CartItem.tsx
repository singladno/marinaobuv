import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface CartItemProps {
  item: {
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
  };
  onRemove: (slug: string) => void;
  onUpdateQuantity: (slug: string, quantity: number) => void;
}

export function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Link
        href={`/product/${item.product.id}`}
        className="flex items-center gap-4"
      >
        <Image
          src={item.product.images[0]?.url || '/placeholder.svg'}
          alt={item.product.images[0]?.alt || item.product.name}
          width={80}
          height={80}
          className="h-20 w-20 rounded-md object-cover"
        />
        <div>
          <Text className="font-semibold text-gray-900 dark:text-gray-100">
            {item.product.name}
          </Text>
          {item.product.article && (
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Артикул: {item.product.article}
            </Text>
          )}
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Категория: {item.product.category.name}
          </Text>
        </div>
      </Link>

      <div className="flex flex-col items-end gap-2">
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatPrice(item.product.pricePair * item.qty)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateQuantity(item.slug, Math.max(1, item.qty - 1))
            }
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title="Уменьшить количество"
            aria-label="Уменьшить количество"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-medium">{item.qty}</span>
          <button
            onClick={() => onUpdateQuantity(item.slug, item.qty + 1)}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title="Увеличить количество"
            aria-label="Увеличить количество"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.slug)}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <TrashIcon className="mr-1 h-4 w-4" /> Удалить
        </Button>
      </div>
    </div>
  );
}
