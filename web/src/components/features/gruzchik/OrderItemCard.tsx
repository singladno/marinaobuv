'use client';

import { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  Package,
  Tag,
  MapPin,
  Calendar,
  Hash,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ImageCarousel } from './ImageCarousel';
import { OrderItemChat } from './OrderItemChat';
import { SourceMessagesModal } from './SourceMessagesModal';
import { AvailabilityToggle } from './AvailabilityToggle';
import { cn } from '@/lib/utils';

export interface OrderItemData {
  // Order info
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  orderLabel: string | null;
  orderPayment: number;
  orderTotal: number;

  // Customer info
  customerName: string | null;
  customerPhone: string;

  // Item info
  itemId: string;
  productId: string;
  itemName: string;
  itemArticle: string | null;
  itemQty: number;
  itemPrice: number;
  itemCode: string | null;
  itemImage: string | null;
  itemImages?: string[];

  // Product details
  sizes?: any;
  pricePair?: number;
  pairsPerBox?: number;
  provider?: string;
  source?: string;
  isAvailable?: boolean;

  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
}

interface OrderItemCardProps {
  item: OrderItemData;
  onChatOpen?: (itemId: string) => void;
  onSourceOpen?: (itemId: string) => void;
  onAvailabilityChange?: (itemId: string, isAvailable: boolean) => void;
  isUpdatingAvailability?: boolean;
  className?: string;
}

export function OrderItemCard({
  item,
  onChatOpen,
  onSourceOpen,
  onAvailabilityChange,
  isUpdatingAvailability = false,
  className,
}: OrderItemCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const images = item.itemImages || (item.itemImage ? [item.itemImage] : []);

  const handleChatOpen = () => {
    setShowChat(true);
    onChatOpen?.(item.itemId);
  };

  const handleSourceOpen = () => {
    setShowSource(true);
    onSourceOpen?.(item.itemId);
  };

  const handleAvailabilityChange = async (isAvailable: boolean) => {
    onAvailabilityChange?.(item.itemId, isAvailable);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (showChat) {
    return <OrderItemChat item={item} onClose={() => setShowChat(false)} />;
  }

  if (showSource) {
    return (
      <SourceMessagesModal
        productId={item.productId}
        productName={item.itemName}
        onClose={() => setShowSource(false)}
      />
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-sm text-gray-600">
                {item.itemCode || 'N/A'}
              </span>
            </div>
            <h3 className="truncate font-semibold text-gray-900">
              {item.itemName}
            </h3>
            {item.itemArticle && (
              <p className="text-sm text-gray-500">
                Артикул: {item.itemArticle}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge
              variant={item.orderStatus === 'Новый' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {item.orderStatus}
            </Badge>
            <AvailabilityToggle
              isAvailable={item.isAvailable ?? false}
              onAvailabilityChange={handleAvailabilityChange}
              loading={isUpdatingAvailability}
              className="text-xs"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Carousel */}
        <ImageCarousel images={images} alt={item.itemName} />

        {/* Order Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-gray-600">
              <Package className="h-4 w-4" />
              <span>Заказ #{item.orderNumber}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.orderDate)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Tag className="h-4 w-4" />
            <span>
              {item.orderLabel
                ? `${item.orderLabel} ${item.customerPhone}`
                : item.customerPhone}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-3">
          {/* Price per pair - highlighted */}
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">
                  Цена за пару
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {item.pricePair
                    ? formatPrice(item.pricePair)
                    : formatPrice(item.itemPrice)}
                </div>
              </div>
              {item.pairsPerBox && (
                <div className="text-right">
                  <div className="text-xs text-blue-600">Пар в коробке</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {item.pairsPerBox}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 text-gray-500">Кол-во коробок</div>
              <div className="font-semibold">{item.itemQty}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 text-gray-500">Цена коробки</div>
              <div className="font-semibold">{formatPrice(item.itemPrice)}</div>
            </div>
          </div>
        </div>

        {/* Sizes */}
        {item.sizes && (
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="mb-2 text-sm text-gray-500">Размеры</div>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(item.sizes) ? (
                item.sizes.map((size: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {size.size || size} x{size.count || 1}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">
                  {JSON.stringify(item.sizes)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Provider */}
        {item.provider && (
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">Поставщик</div>
            <div className="font-medium">{item.provider}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 border-t border-gray-100 pt-4">
          <Button
            onClick={handleChatOpen}
            className="flex flex-1 items-center justify-center space-x-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Чат</span>
          </Button>
          {item.source && (
            <Button
              onClick={handleSourceOpen}
              variant="outline"
              className="flex flex-1 items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Источник</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
