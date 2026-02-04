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
import { AvailabilityControl } from './AvailabilityControl';
import { PurchaseControl } from './PurchaseControl';
import { ChatImagesPreview } from './ChatImagesPreview';
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
  pricePair: number;
  pairsPerBox?: number;
  provider?: string;
  source?: string;
  isAvailable?: boolean | null;
  isPurchased?: boolean | null;

  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
}

interface OrderItemCardProps {
  item: OrderItemData;
  onChatOpen?: (itemId: string) => void;
  onSourceOpen?: (itemId: string) => void;
  onAvailabilityChange?: (
    itemId: string,
    isAvailable: boolean | null,
    clickedButton?: boolean
  ) => void;
  onPurchaseChange?: (
    itemId: string,
    isPurchased: boolean | null,
    clickedButton?: boolean
  ) => void;
  isUpdatingAvailability?: boolean;
  isUpdatingToTrue?: boolean;
  isUpdatingToFalse?: boolean;
  isUnsetting?: boolean;
  isUnsettingFromTrue?: boolean;
  isUnsettingFromFalse?: boolean;
  isUpdatingPurchase?: boolean;
  isUpdatingPurchaseToTrue?: boolean;
  isUpdatingPurchaseToFalse?: boolean;
  isUnsettingPurchase?: boolean;
  isUnsettingPurchaseFromTrue?: boolean;
  isUnsettingPurchaseFromFalse?: boolean;
  usePurchaseControl?: boolean; // If true, show PurchaseControl instead of AvailabilityControl
  className?: string;
}

export function OrderItemCard({
  item,
  onChatOpen,
  onSourceOpen,
  onAvailabilityChange,
  onPurchaseChange,
  isUpdatingAvailability = false,
  isUpdatingToTrue = false,
  isUpdatingToFalse = false,
  isUnsetting = false,
  isUnsettingFromTrue = false,
  isUnsettingFromFalse = false,
  isUpdatingPurchase = false,
  isUpdatingPurchaseToTrue = false,
  isUpdatingPurchaseToFalse = false,
  isUnsettingPurchase = false,
  isUnsettingPurchaseFromTrue = false,
  isUnsettingPurchaseFromFalse = false,
  usePurchaseControl = false,
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

  const handleAvailabilityChange = async (
    isAvailable: boolean | null,
    clickedButton?: boolean
  ) => {
    console.log('🔗 OrderItemCard handleAvailabilityChange:', {
      isAvailable,
      clickedButton,
      itemId: item.itemId,
    });
    await onAvailabilityChange?.(item.itemId, isAvailable, clickedButton);
  };

  const handlePurchaseChange = async (
    isPurchased: boolean | null,
    clickedButton?: boolean
  ) => {
    await onPurchaseChange?.(item.itemId, isPurchased, clickedButton);
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
    <Card
      className={cn(
        'w-full shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <CardHeader className="px-3 pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-sm text-gray-600">
                {item.itemCode || 'N/A'}
              </span>
              <span className="text-gray-300">•</span>
              <h3 className="truncate font-semibold text-gray-900">
                {item.itemName}
              </h3>
            </div>
            {item.itemArticle && (
              <p className="text-sm text-gray-500">
                Артикул: {item.itemArticle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3">
        {/* Image Carousel */}
        <ImageCarousel
          images={images}
          alt={item.itemName}
          orderNumber={item.orderNumber}
          productArticle={item.itemArticle}
          count={item.itemQty}
          itemCode={item.itemCode}
          sizes={item.sizes}
        />

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
        <div className="space-y-2">
          {/* Pricing - all three fields on same line */}
          <div className="flex gap-1">
            {/* Price per pair */}
            <div className="flex-1 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-1.5">
              <div className="mb-0.5 text-xs font-medium text-blue-700">
                Пара
              </div>
              <div className="text-sm font-bold text-blue-900">
                {formatPrice(item.pricePair)}
              </div>
            </div>

            {/* Box price */}
            <div className="flex-1 rounded-lg bg-gray-50 p-1.5">
              <div className="mb-0.5 text-xs text-gray-500">Коробка</div>
              <div className="text-sm font-semibold">
                {formatPrice(item.itemPrice)}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex-1 rounded-lg bg-gray-50 p-1.5">
              <div className="mb-0.5 text-xs text-gray-500">Кол-во</div>
              <div className="text-sm font-semibold">{item.itemQty}</div>
            </div>
          </div>

          {/* Sizes - displayed on one line below prices */}
          {item.sizes && (
            <div className="flex flex-wrap justify-center gap-2">
              {Array.isArray(item.sizes) ? (
                item.sizes.map((size: any, index: number) => {
                  // Handle object format: {size: '36', count: 2}
                  const sizeValue =
                    typeof size === 'object' && size !== null && 'size' in size
                      ? size.size
                      : typeof size === 'string' || typeof size === 'number'
                        ? String(size)
                        : '—';
                  const countValue =
                    typeof size === 'object' && size !== null && 'count' in size
                      ? size.count
                      : 1;

                  return (
                    <div
                      key={index}
                      className="flex aspect-square w-12 flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-sm"
                    >
                      <span className="font-medium text-gray-900">
                        {sizeValue}
                      </span>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                        {countValue}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm">
                  <span className="font-medium text-gray-900">
                    {JSON.stringify(item.sizes)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Availability/Purchase Control */}
          {usePurchaseControl ? (
            <PurchaseControl
              isPurchased={item.isPurchased ?? null}
              onPurchaseChange={handlePurchaseChange}
              loading={isUpdatingPurchase}
              loadingTrue={isUpdatingPurchaseToTrue}
              loadingFalse={isUpdatingPurchaseToFalse}
              loadingUnset={isUnsettingPurchase}
              loadingUnsetFromTrue={isUnsettingPurchaseFromTrue}
              loadingUnsetFromFalse={isUnsettingPurchaseFromFalse}
            />
          ) : (
            <AvailabilityControl
              isAvailable={item.isAvailable ?? null}
              onAvailabilityChange={handleAvailabilityChange}
              loading={isUpdatingAvailability}
              loadingTrue={isUpdatingToTrue}
              loadingFalse={isUpdatingToFalse}
              loadingUnset={isUnsetting}
              loadingUnsetFromTrue={isUnsettingFromTrue}
              loadingUnsetFromFalse={isUnsettingFromFalse}
            />
          )}
        </div>

        {/* Provider */}
        {item.provider && (
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">Поставщик</div>
            <div className="font-medium">{item.provider}</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 border-t border-gray-100 pt-2">
          <div className="flex space-x-3">
            <Button
              onClick={handleChatOpen}
              className="flex flex-1 items-center justify-center space-x-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              size="sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Комментарий</span>
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
          {/* Chat Images Preview */}
          <ChatImagesPreview itemId={item.itemId} />
        </div>
      </CardContent>
    </Card>
  );
}
