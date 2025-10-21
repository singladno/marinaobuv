import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  MessageSquare,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { ChatButtonWithIndicator } from './ChatButtonWithIndicator';
import { ItemApproveButton } from './ItemApproveButton';
import { useOrderData } from '@/hooks/useOrderData';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  isAvailable?: boolean | null;
  boxes?: number;
  pricePair?: number;
  product: {
    id: string;
    slug: string;
    name: string;
    pricePair?: number;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
}

interface OrderItemsProps {
  items: OrderItem[];
  onChatClick?: (item: OrderItem) => void;
  onItemApproval?: (itemId: string) => void;
  showMessages?: boolean;
  orderId?: string;
}

export function OrderItems({
  items,
  onChatClick,
  onItemApproval,
  showMessages = false,
  orderId,
}: OrderItemsProps) {
  const {
    hasMessages,
    needsApproval,
    getTotalMessages,
    getUnreadCount,
    getApprovalStatus,
    markItemAsApproved,
  } = useOrderData(orderId || null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  const getAvailabilityIcon = (isAvailable: boolean | null | undefined) => {
    if (isAvailable === true) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (isAvailable === false) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else {
      return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAvailabilityText = (isAvailable: boolean | null | undefined) => {
    if (isAvailable === true) {
      return 'В наличии';
    } else if (isAvailable === false) {
      return 'Нет в наличии';
    } else {
      return 'Проверяется';
    }
  };

  return (
    <div className="space-y-4">
      {items.map(item => {
        const primaryImage = item.product.images[0];
        const unreadData = getUnreadCount(item.id);
        const totalMessages = getTotalMessages(item.id);
        const itemNeedsApproval = needsApproval(item.id, item.isAvailable);
        const itemHasMessages = hasMessages(item.id);

        return (
          <div
            key={item.id}
            className={`rounded-lg border p-4 transition-all ${
              itemNeedsApproval
                ? 'attention-pulse border-orange-200 bg-orange-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="mb-3 flex items-start space-x-3">
                {/* Product Image */}
                <div className="h-16 w-16 flex-shrink-0">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="block"
                  >
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt || item.product.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80"
                      />
                    ) : (
                      <div className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg bg-gray-200 transition-opacity hover:opacity-80">
                        <span className="text-xs text-gray-500">Нет фото</span>
                      </div>
                    )}
                  </Link>
                </div>

                {/* Product Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-sm font-medium text-gray-900">
                    {item.product.name}
                  </div>
                  {item.article && (
                    <div className="mb-2 text-xs text-gray-500">
                      Арт: {item.article}
                    </div>
                  )}

                  {/* Availability Status */}
                  <div className="flex items-center space-x-2">
                    {getAvailabilityIcon(item.isAvailable)}
                    <span className="text-xs text-gray-600">
                      {getAvailabilityText(item.isAvailable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Info - Mobile */}
              <div className="mb-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Кол-во коробок:</span>
                  <span className="font-medium">{item.boxes || item.qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Цена за пару:</span>
                  <span className="font-medium">
                    {formatPrice(item.pricePair || item.priceBox)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Цена за коробку:</span>
                  <span className="font-medium">
                    {formatPrice(item.priceBox)}
                  </span>
                </div>
              </div>

              {/* Actions - Mobile */}
              {showMessages && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <div className="flex items-center space-x-2">
                    {onChatClick && (
                      <ChatButtonWithIndicator
                        itemId={item.id}
                        onClick={() => onChatClick(item)}
                        unreadCount={unreadData.unreadCount}
                      />
                    )}
                    {itemNeedsApproval && (
                      <ItemApproveButton
                        itemId={item.id}
                        size="sm"
                        onApprovalComplete={() => {
                          markItemAsApproved(item.id);
                          onItemApproval?.(item.id);
                        }}
                        unreadCount={unreadData.unreadCount}
                      />
                    )}
                  </div>
                  {itemNeedsApproval &&
                    !getApprovalStatus(item.id).isApproved && (
                      <div className="text-xs font-medium text-orange-600">
                        Требует одобрения
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden items-start space-x-3 md:flex">
              {/* Product Image */}
              <div className="h-16 w-16 flex-shrink-0">
                <Link href={`/product/${item.product.slug}`} className="block">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt || item.product.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80"
                    />
                  ) : (
                    <div className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg bg-gray-200 transition-opacity hover:opacity-80">
                      <span className="text-xs text-gray-500">Нет фото</span>
                    </div>
                  )}
                </Link>
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.product.name}
                  </div>
                  {item.article && (
                    <div className="text-xs text-gray-500">
                      Арт: {item.article}
                    </div>
                  )}
                </div>

                {/* Pricing Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Цена за пару:</span>
                    <span className="ml-1 font-medium">
                      {formatPrice(item.product.pricePair || item.priceBox)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Кол-во коробок:</span>
                    <span className="ml-1 font-medium">
                      {item.boxes || item.qty}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Цена за коробку:</span>
                    <span className="ml-1 font-medium">
                      {formatPrice(item.priceBox)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability Status and Actions */}
              <div className="w-44 flex-shrink-0">
                <div className="flex flex-col items-end space-y-2">
                  {/* Availability Status */}
                  <div className="flex items-center justify-end space-x-2">
                    {getAvailabilityIcon(item.isAvailable)}
                    <span className="text-xs text-gray-600">
                      {getAvailabilityText(item.isAvailable)}
                    </span>
                  </div>

                  {/* Actions */}
                  {showMessages && (
                    <div className="flex items-center space-x-2">
                      {onChatClick && (
                        <ChatButtonWithIndicator
                          itemId={item.id}
                          onClick={() => onChatClick(item)}
                          unreadCount={unreadData.unreadCount}
                        />
                      )}
                      {itemNeedsApproval && (
                        <ItemApproveButton
                          itemId={item.id}
                          size="sm"
                          onApprovalComplete={() => {
                            markItemAsApproved(item.id);
                            onItemApproval?.(item.id);
                          }}
                          unreadCount={unreadData.unreadCount}
                        />
                      )}
                    </div>
                  )}

                  {itemNeedsApproval &&
                    !getApprovalStatus(item.id).isApproved && (
                      <div className="text-xs font-medium text-orange-600">
                        Требует одобрения
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
