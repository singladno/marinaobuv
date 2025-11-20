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
import { formatOrderNumber } from '@/utils/orderNumberUtils';

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
    attachments?: Array<{
      type: string;
      name: string;
      size?: number;
      data?: string;
      url?: string;
    }>;
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
  transportId: string | null;
  transportName: string | null;
  transportOptions?: Array<{
    id: string;
    transportId: string;
    transportName: string;
  }>;
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
  const { getUnreadCount, refetch: refetchUnreadCounts } =
    useAdminOrderUnreadCounts(orderId);

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
      console.log('Submitting replacement proposal:', data);
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

      const responseData = await response.json();
      console.log('Replacement response:', responseData);

      if (response.ok) {
        // Refresh order data
        const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrder(orderData.order);
        }
        setReplacementModalOpen(false);
        setSelectedItemForReplacement(null);
      } else if (response.status === 409) {
        // Handle existing proposal
        console.log(
          'Existing replacement proposal found:',
          responseData.existingReplacement
        );
        const shouldUpdate = confirm(
          `Предложение о замене уже существует. Хотите обновить его?`
        );

        if (shouldUpdate) {
          await handleReplacementUpdate(
            responseData.existingReplacement.id,
            data
          );
        }
      } else {
        console.error('Failed to create replacement proposal:', responseData);
        alert(`Ошибка: ${responseData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Failed to create replacement proposal:', error);
      alert(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleReplacementUpdate = async (
    replacementId: string,
    data: {
      replacementImageUrl?: string;
      replacementImageKey?: string;
      adminComment?: string;
    }
  ) => {
    if (!selectedItemForReplacement) return;

    try {
      const response = await fetch(
        `/api/admin/order-items/${selectedItemForReplacement.id}/replacement`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            replacementId,
            ...data,
          }),
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
        alert('Предложение о замене обновлено');
      } else {
        const responseData = await response.json();
        alert(
          `Ошибка обновления: ${responseData.error || 'Неизвестная ошибка'}`
        );
      }
    } catch (error) {
      console.error('Failed to update replacement:', error);
      alert(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleReplacementDelete = async (replacementId: string) => {
    if (!selectedItemForReplacement) return;

    try {
      const response = await fetch(
        `/api/admin/order-items/${selectedItemForReplacement.id}/replacement`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ replacementId }),
        }
      );

      if (response.ok) {
        // Refresh order data
        const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrder(orderData.order);
        }
        alert('Предложение о замене удалено');
      } else {
        const responseData = await response.json();
        alert(`Ошибка удаления: ${responseData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Failed to delete replacement:', error);
      alert(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
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
          onClose={() => {
            setSelectedItemId(null);
            // Refresh unread counts when chat is closed
            refetchUnreadCounts();
          }}
          onMessagesRead={() => {
            // Refresh unread counts immediately when messages are marked as read
            refetchUnreadCounts();
          }}
        />
      );
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:space-x-4">
          <Button onClick={() => router.back()} variant="outline" size="sm" className="shrink-0">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:space-x-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl truncate">
                  Заказ {formatOrderNumber(order.orderNumber)}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm mt-1">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Транспортная компания</h3>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {order.transportOptions && order.transportOptions.length > 0
                ? order.transportOptions.map(opt => opt.transportName).join(', ')
                : order.transportName || 'Не выбрана'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold sm:text-lg">Товары в заказе</h2>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="px-4 py-4 bg-white dark:bg-gray-800"
                >
                  <div className="space-y-4">
                    {/* Item Header */}
                    <div className="flex items-start gap-3">
                      {/* Image */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt || item.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg
                              className="h-6 w-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h3>
                        {item.itemCode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Код: {item.itemCode}
                          </div>
                        )}
                        {item.product.article && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Артикул: {item.product.article}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Количество
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.qty} шт.
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Наличие
                        </div>
                        <div>{getAvailabilityBadge(item.isAvailable)}</div>
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Размеры
                      </div>
                      {renderSizes(item.product.sizes)}
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">За пару</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {formatPrice(item.product.pricePair)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">За коробку</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {formatPrice(item.priceBox)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Сумма</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                          {formatPrice(item.priceBox * item.qty)}
                        </div>
                      </div>
                    </div>

                    {/* Feedback and Messages */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Обратная связь
                        </div>
                        <div className="space-y-2">
                          <FeedbackStatusIconsCompact
                            feedbacks={item.feedbacks.map(feedback => ({
                              type: feedback.feedbackType,
                              createdAt: feedback.createdAt,
                            }))}
                            replacements={item.replacements}
                            hasMessages={item.messages.length > 0}
                          />
                          {item.replacements
                            .filter(rep => rep.status === 'PENDING')
                            .map(replacement => (
                              <div
                                key={replacement.id}
                                className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                      Предложена замена
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    onClick={() => {
                                      setSelectedItemForReplacement(item);
                                      setReplacementModalOpen(true);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 flex-1 text-xs"
                                  >
                                    Изменить
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (
                                        confirm('Удалить предложение о замене?')
                                      ) {
                                        handleReplacementDelete(replacement.id);
                                      }
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                  >
                                    Удалить
                                  </Button>
                                </div>
                                {replacement.adminComment && (
                                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                    {replacement.adminComment}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Сообщения
                        </div>
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
                          maxLength={100}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <ChatButtonWithIndicator
                        itemId={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        unreadCount={getUnreadCount(item.id).unreadCount}
                      />
                      <Button
                        onClick={() => handleReplacementProposal(item)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Предложить замену</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
                        <div className="space-y-2">
                          <FeedbackStatusIconsCompact
                            feedbacks={item.feedbacks.map(feedback => ({
                              type: feedback.feedbackType,
                              createdAt: feedback.createdAt,
                            }))}
                            replacements={item.replacements}
                            hasMessages={item.messages.length > 0}
                          />
                          {item.replacements
                            .filter(rep => rep.status === 'PENDING')
                            .map(replacement => (
                              <div
                                key={replacement.id}
                                className="rounded-lg border border-blue-200 bg-blue-50 p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <RefreshCw className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800">
                                      Предложена замена
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      onClick={() => {
                                        setSelectedItemForReplacement(item);
                                        setReplacementModalOpen(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs"
                                    >
                                      Изменить
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (
                                          confirm('Удалить предложение о замене?')
                                        ) {
                                          handleReplacementDelete(replacement.id);
                                        }
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="h-6 border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                      Удалить
                                    </Button>
                                  </div>
                                </div>
                                {replacement.adminComment && (
                                  <p className="mt-1 text-xs text-blue-700">
                                    {replacement.adminComment}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
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
          existingReplacement={
            selectedItemForReplacement.replacements.find(
              rep => rep.status === 'PENDING'
            ) || null
          }
          availableImages={(() => {
            const images = selectedItemForReplacement.messages
              .filter(msg => msg.attachments && msg.attachments.length > 0)
              .flatMap(msg =>
                msg
                  .attachments!.filter(att => att.type.startsWith('image/'))
                  .map(att => ({
                    id: `${msg.id}-${att.name}`,
                    type: att.type,
                    name: att.name,
                    url: att.data || att.url,
                    data: att.data,
                  }))
              );
            console.log('Available images for replacement:', images);
            return images;
          })()}
        />
      )}
    </div>
  );
}
