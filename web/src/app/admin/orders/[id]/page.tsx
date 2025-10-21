'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, Tag, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableLoader } from '@/components/ui/Loader';
import { AdminOrderItemChat } from '@/components/features/admin/AdminOrderItemChat';
import { ChatButtonWithIndicator } from '@/components/features/admin/ChatButtonWithIndicator';
import { OrderItemData } from '@/components/features/gruzchik/OrderItemCard';
import { useAdminOrderUnreadCounts } from '@/hooks/useAdminOrderUnreadCounts';
import { StatusBadge } from '@/components/features/OrderStatusBadge';
import { FeedbackStatusIconsCompact } from '@/components/features/admin/FeedbackStatusIcons';
import { MessagePreviewCompact } from '@/components/features/admin/MessagePreview';
import { AdminReplacementModal } from '@/components/features/admin/AdminReplacementModal';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  itemCode: string | null;
  isAvailable: boolean | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    article: string | null;
    pricePair: number;
    sizes: any;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
  feedbacks: Array<{
    id: string;
    feedbackType: 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT';
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      phone: string;
    };
  }>;
  replacements: Array<{
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    replacementImageUrl: string | null;
    replacementImageKey: string | null;
    adminComment: string | null;
    clientComment: string | null;
    createdAt: string;
    adminUser: {
      id: string;
      name: string | null;
      phone: string;
    };
    clientUser: {
      id: string;
      name: string | null;
      phone: string;
    };
  }>;
  messages: Array<{
    id: string;
    text: string | null;
    isService: boolean;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      phone: string;
      role: string;
    };
  }>;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  phone: string;
  fullName: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  label: string | null;
  payment: number;
  gruzchikId: string | null;
  gruzchik?: { id: string; name: string | null } | null;
  user?: {
    id: string;
    name: string | null;
    phone: string | null;
    label: string | null;
  } | null;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [selectedItemForReplacement, setSelectedItemForReplacement] =
    useState<OrderItem | null>(null);

  // Get unread counts for all items in this order
  const { getUnreadCount } = useAdminOrderUnreadCounts(orderId);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch order details'
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailabilityBadge = (isAvailable: boolean | null) => {
    if (isAvailable === null) {
      return (
        <Badge
          variant="outline"
          className="border-gray-300 bg-gray-50 text-gray-600"
        >
          Не указано
        </Badge>
      );
    }
    return isAvailable ? (
      <Badge
        variant="outline"
        className="!border-green-400 !bg-green-400 !text-white hover:!bg-green-500"
      >
        В наличии
      </Badge>
    ) : (
      <Badge
        variant="default"
        className="border-red-500 bg-red-500 text-white hover:bg-red-600"
      >
        Нет в наличии
      </Badge>
    );
  };

  const getApprovalBadge = () => {
    return (
      <Badge
        variant="outline"
        className="!border-yellow-400 !bg-yellow-400 !text-black hover:!bg-yellow-500"
      >
        Не согласовано
      </Badge>
    );
  };

  const renderSizes = (sizes: any) => {
    if (!sizes) return <span className="text-gray-400">—</span>;

    if (Array.isArray(sizes)) {
      return (
        <div className="flex gap-1 overflow-x-auto">
          {sizes.map((size: any, index: number) => (
            <div
              key={index}
              className="flex aspect-square w-8 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-xs"
            >
              <span className="font-medium text-gray-900">
                {size.size || size}
              </span>
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-purple-100 text-[10px] font-medium text-purple-700">
                {size.count || 1}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-gray-400">—</span>;
  };

  const handleReplacementProposal = (item: OrderItem) => {
    setSelectedItemForReplacement(item);
    setReplacementModalOpen(true);
  };

  const handleReplacementSubmit = async (data: {
    replacementImageUrl?: string;
    replacementImageKey?: string;
    adminComment?: string;
  }) => {
    if (!selectedItemForReplacement) return;

    try {
      const response = await fetch(
        `/api/admin/order-items/${selectedItemForReplacement.id}/replacement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        // Refresh order data
        const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrder(orderData.order);
        }
        setReplacementModalOpen(false);
        setSelectedItemForReplacement(null);
      } else {
        console.error('Failed to create replacement proposal');
      }
    } catch (error) {
      console.error('Failed to create replacement proposal:', error);
    }
  };

  const convertToOrderItemData = (item: OrderItem): OrderItemData => {
    return {
      // Order info
      orderId: order?.id || '',
      orderNumber: order?.orderNumber || '',
      orderDate: order?.createdAt || '',
      orderStatus: order?.status || '',
      orderLabel: order?.label || null,
      orderPayment: order?.payment || 0,
      orderTotal: order?.total || 0,

      // Customer info
      customerName: order?.fullName || null,
      customerPhone: order?.phone || '',

      // Item info
      itemId: item.id,
      productId: item.productId,
      itemName: item.name,
      itemArticle: item.article,
      itemQty: item.qty,
      itemPrice: item.priceBox,
      itemCode: item.itemCode,
      itemImage: item.product.images[0]?.url || null,
      itemImages: item.product.images.map(img => img.url),

      // Product details
      sizes: item.product.sizes,
      pricePair: item.product.pricePair,
      pairsPerBox: undefined,
      provider: undefined,
      source: undefined,
      isAvailable: item.isAvailable,
    };
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <TableLoader message="Загрузка деталей заказа..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Ошибка загрузки
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || 'Заказ не найден'}
          </p>
          <Button
            onClick={() => router.back()}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (selectedItemId) {
    const selectedItem = order.items.find(item => item.id === selectedItemId);
    if (selectedItem) {
      return (
        <AdminOrderItemChat
          item={convertToOrderItemData(selectedItem)}
          onClose={() => setSelectedItemId(null)}
        />
      );
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Заказ {order.orderNumber}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Клиент</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {order.user?.label || 'Без метки'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{order.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Сумма</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
            <p className="text-sm text-gray-600">
              Оплата: {formatPrice(order.payment)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Грузчик</h3>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {order.gruzchik?.name || 'Не назначен'}
            </p>
            {order.transportName && (
              <p className="text-sm text-gray-600">{order.transportName}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Товары в заказе</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
              {/* Header */}
              <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Код
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Изображение
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Название
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Артикул
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Кол-во
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Размеры
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Наличие
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Обратная связь
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Сообщения
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    За пару
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    За коробку
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Сумма
                  </th>
                  <th className="sticky right-0 z-30 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    Действия
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="bg-white dark:bg-gray-900">
                {order.items.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {item.itemCode || '—'}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                      )}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      {item.product.article || '—'}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {item.qty}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                      {renderSizes(item.product.sizes)}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                      {getAvailabilityBadge(item.isAvailable)}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                      <FeedbackStatusIconsCompact
                        feedbacks={item.feedbacks.map(feedback => ({
                          type: feedback.feedbackType,
                          createdAt: feedback.createdAt,
                        }))}
                        replacements={item.replacements}
                        hasMessages={item.messages.length > 0}
                      />
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                      <MessagePreviewCompact
                        messages={item.messages.map(message => ({
                          id: message.id,
                          text: message.text,
                          sender:
                            message.user.role === 'ADMIN'
                              ? 'admin'
                              : message.user.role === 'GRUZCHIK'
                                ? 'gruzchik'
                                : 'client',
                          senderName: message.user.name || undefined,
                          isService: message.isService,
                          createdAt: message.createdAt,
                        }))}
                        maxLength={50}
                      />
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {formatPrice(item.product.pricePair)}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {formatPrice(item.priceBox)}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {formatPrice(item.priceBox * item.qty)}
                    </td>
                    <td className="sticky right-0 z-20 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex items-center space-x-2">
                        <ChatButtonWithIndicator
                          itemId={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          unreadCount={getUnreadCount(item.id).unreadCount}
                        />
                        <Button
                          onClick={() => handleReplacementProposal(item)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span className="text-xs">Замена</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Replacement Modal */}
      {replacementModalOpen && selectedItemForReplacement && (
        <AdminReplacementModal
          isOpen={replacementModalOpen}
          onClose={() => {
            setReplacementModalOpen(false);
            setSelectedItemForReplacement(null);
          }}
          onSubmit={handleReplacementSubmit}
          itemName={selectedItemForReplacement.name}
          availableImages={selectedItemForReplacement.messages
            .filter(msg => msg.text && msg.text.includes('image'))
            .map(msg => ({
              id: msg.id,
              type: 'image',
              name: 'Chat image',
              url: msg.text || undefined,
            }))}
        />
      )}
    </div>
  );
}
