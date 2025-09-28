import Image from 'next/image';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
}

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  return (
    <div className="space-y-3">
      {items.map(item => {
        const primaryImage = item.product.images[0];
        return (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="h-12 w-12 flex-shrink-0">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || item.product.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                  <span className="text-xs text-gray-500">Нет фото</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">
                {item.product.name}
              </div>
              {item.article && (
                <div className="text-xs text-gray-500">Арт: {item.article}</div>
              )}
            </div>
            <div className="text-sm text-gray-900">
              {item.qty} × {formatPrice(item.priceBox)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
