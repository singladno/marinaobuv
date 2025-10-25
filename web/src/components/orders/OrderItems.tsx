import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  MessageSquare,
  Package,
  AlertTriangle,
  MessageCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ChatButtonWithIndicator } from './ChatButtonWithIndicator';
import { ItemApproveButton } from './ItemApproveButton';
import { OrderItemFeedbackModal } from '@/components/features/orders/OrderItemFeedbackModal';
import { OrderItemRefusalModal } from '@/components/features/orders/OrderItemRefusalModal';
import { useOrderData } from '@/hooks/useOrderData';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

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
  replacements?: Array<{
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    replacementImageUrl: string | null;
    adminComment: string | null;
    createdAt: string;
  }>;
  feedbacks?: Array<{
    id: string;
    feedbackType: 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT';
    refusalReason?: string | null;
    createdAt: string;
  }>;
}

interface OrderItemsProps {
  items: OrderItem[];
  onChatClick?: (item: OrderItem) => void;
  onItemApproval?: (itemId: string) => void;
  showMessages?: boolean;
  orderId?: string;
  showFeedback?: boolean;
  orderStatus?: string;
}

export function OrderItems({
  items,
  onChatClick,
  onItemApproval,
  showMessages = false,
  orderId,
  showFeedback = false,
  orderStatus,
}: OrderItemsProps) {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [refusalModalOpen, setRefusalModalOpen] = useState(false);
  const [selectedItemForFeedback, setSelectedItemForFeedback] =
    useState<OrderItem | null>(null);
  const [selectedItemForRefusal, setSelectedItemForRefusal] =
    useState<OrderItem | null>(null);

  const {
    hasMessages,
    needsApproval,
    getTotalMessages,
    getUnreadCount,
    getApprovalStatus,
    markItemAsApproved,
  } = useOrderData(orderId || null);

  // Determine if this is an approval status
  const isApprovalStatus = orderStatus === 'Согласование';

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

  const handleFeedbackClick = (item: OrderItem) => {
    setSelectedItemForFeedback(item);
    setFeedbackModalOpen(true);
  };

  const handleRefusalClick = (item: OrderItem) => {
    setSelectedItemForRefusal(item);
    setRefusalModalOpen(true);
  };

  const handleFeedbackSubmit = async (
    feedbackType: 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT'
  ) => {
    if (!selectedItemForFeedback) return;

    try {
      const response = await fetch(
        `/api/order-items/${selectedItemForFeedback.id}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feedbackType }),
        }
      );

      if (response.ok) {
        // Feedback submitted successfully
        setFeedbackModalOpen(false);
        setSelectedItemForFeedback(null);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleRefusalSubmit = async (
    reason: string,
    type: 'WRONG_SIZE' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'OTHER'
  ) => {
    if (!selectedItemForRefusal) return;

    try {
      const response = await fetch(
        `/api/order-items/${selectedItemForRefusal.id}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedbackType: type === 'QUALITY_ISSUE' ? 'WRONG_ITEM' : type,
            refusalReason: reason,
          }),
        }
      );

      if (response.ok) {
        // Refusal submitted successfully
        setRefusalModalOpen(false);
        setSelectedItemForRefusal(null);
        // Refresh the page to show updated totals
        window.location.reload();
      } else {
        console.error('Failed to submit refusal');
      }
    } catch (error) {
      console.error('Failed to submit refusal:', error);
    }
  };

  const getPendingReplacement = (item: OrderItem) => {
    return item.replacements?.find(rep => rep.status === 'PENDING');
  };

  const isItemRefused = (item: OrderItem) => {
    // Check if item has refusal feedback
    return item.feedbacks?.some(
      feedback =>
        feedback.feedbackType === 'WRONG_SIZE' ||
        feedback.feedbackType === 'WRONG_ITEM'
    );
  };

  const getRefusalReason = (item: OrderItem) => {
    const refusalFeedback = item.feedbacks?.find(
      feedback =>
        feedback.feedbackType === 'WRONG_SIZE' ||
        feedback.feedbackType === 'WRONG_ITEM'
    );
    return refusalFeedback?.refusalReason || 'Причина не указана';
  };

  return (
    <div className="space-y-4">
      {items.map(item => {
        const primaryImage = item.product.images[0];
        const unreadData = getUnreadCount(item.id);
        const totalMessages = getTotalMessages(item.id);
        const itemNeedsApproval = needsApproval(item.id, item.isAvailable);
        const itemHasMessages = hasMessages(item.id);
        const pendingReplacement = getPendingReplacement(item);
        const itemRefused = isItemRefused(item);
        const refusalReason = getRefusalReason(item);

        return (
          <div
            key={item.id}
            className={`rounded-lg border p-4 transition-all ${
              itemRefused
                ? 'border-red-200 bg-red-50'
                : isApprovalStatus && itemNeedsApproval
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

                  {/* Refusal Status */}
                  {itemRefused && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">Отказано</span>
                    </div>
                  )}

                  {/* Availability Status - only for approval orders */}
                  {isApprovalStatus && !itemRefused && (
                    <div className="flex items-center space-x-2">
                      {getAvailabilityIcon(item.isAvailable)}
                      <span className="text-xs text-gray-600">
                        {getAvailabilityText(item.isAvailable)}
                      </span>
                    </div>
                  )}

                  {/* Replacement Proposal Indicator - only for approval orders */}
                  {isApprovalStatus && pendingReplacement && (
                    <div className="mt-2 flex items-center space-x-2 text-blue-600">
                      <RefreshCw className="h-3 w-3" />
                      <span className="text-xs">
                        предложена замена - перейдите в чат
                      </span>
                    </div>
                  )}
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
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <div className="flex items-center space-x-2">
                  {onChatClick && (
                    <ChatButtonWithIndicator
                      itemId={item.id}
                      onClick={() => onChatClick(item)}
                      unreadCount={unreadData.unreadCount}
                    />
                  )}
                  {isApprovalStatus && showFeedback && !itemRefused && (
                    <Button
                      onClick={() => handleRefusalClick(item)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Отказ</span>
                    </Button>
                  )}
                  {isApprovalStatus && itemNeedsApproval && (
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
                {isApprovalStatus &&
                  itemNeedsApproval &&
                  !getApprovalStatus(item.id).isApproved && (
                    <div className="text-xs font-medium text-orange-600">
                      Требует одобрения
                    </div>
                  )}
              </div>
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
                  {/* Refusal Status */}
                  {itemRefused && (
                    <div className="flex items-center justify-end space-x-2 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">Отказано</span>
                    </div>
                  )}

                  {/* Availability Status - only for approval orders */}
                  {isApprovalStatus && !itemRefused && (
                    <div className="flex items-center justify-end space-x-2">
                      {getAvailabilityIcon(item.isAvailable)}
                      <span className="text-xs text-gray-600">
                        {getAvailabilityText(item.isAvailable)}
                      </span>
                    </div>
                  )}

                  {/* Replacement Proposal Indicator - only for approval orders */}
                  {isApprovalStatus && pendingReplacement && (
                    <div className="mt-2 flex items-center space-x-2 text-blue-600">
                      <RefreshCw className="h-3 w-3" />
                      <span className="text-xs">
                        предложена замена - перейдите в чат
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {onChatClick && (
                      <ChatButtonWithIndicator
                        itemId={item.id}
                        onClick={() => onChatClick(item)}
                        unreadCount={unreadData.unreadCount}
                      />
                    )}
                    {isApprovalStatus && showFeedback && !itemRefused && (
                      <Button
                        onClick={() => handleRefusalClick(item)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="text-xs">Отказ</span>
                      </Button>
                    )}
                    {isApprovalStatus && itemNeedsApproval && (
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

                  {isApprovalStatus &&
                    itemNeedsApproval &&
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

      {/* Feedback Modal */}
      {feedbackModalOpen && selectedItemForFeedback && (
        <OrderItemFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setSelectedItemForFeedback(null);
          }}
          onFeedback={handleFeedbackSubmit}
          itemName={selectedItemForFeedback.name}
          hasReplacementProposal={false} // TODO: Check if there's a pending replacement
        />
      )}

      {/* Refusal Modal */}
      {refusalModalOpen && selectedItemForRefusal && (
        <OrderItemRefusalModal
          isOpen={refusalModalOpen}
          onClose={() => {
            setRefusalModalOpen(false);
            setSelectedItemForRefusal(null);
          }}
          onRefusal={handleRefusalSubmit}
          itemName={selectedItemForRefusal.name}
        />
      )}
    </div>
  );
}
