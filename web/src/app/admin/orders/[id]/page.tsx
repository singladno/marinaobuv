'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageSquare,
  Tag,
  RefreshCw,
  User,
  DollarSign,
  UserCheck,
  Truck,
  MapPin,
  ExternalLink,
  Building2,
  Phone,
  Trash2,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableLoader } from '@/components/ui/Loader';
import { AdminOrderItemChat } from '@/components/features/admin/AdminOrderItemChat';
import { ChatButtonWithIndicator } from '@/components/features/admin/ChatButtonWithIndicator';
import { OrderItemData } from '@/components/features/gruzchik/OrderItemCard';
import { useAdminOrderUnreadCounts } from '@/hooks/useAdminOrderUnreadCounts';
import { EditableStatusBadge } from '@/components/features/EditableStatusBadge';
import { EditableGruzchikSelector } from '@/components/features/EditableGruzchikSelector';
import { FeedbackStatusIconsCompact } from '@/components/features/admin/FeedbackStatusIcons';
import { MessagePreviewCompact } from '@/components/features/admin/MessagePreview';
import { AdminReplacementModal } from '@/components/features/admin/AdminReplacementModal';
import { ProductImageModal } from '@/components/features/ProductImageModal';
import { AddProductsToOrderModal } from '@/components/features/admin/AddProductsToOrderModal';
import { cn } from '@/lib/utils';
import { formatOrderNumber } from '@/utils/orderNumberUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';

interface OrderItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  itemCode: string | null;
  color: string | null;
  isAvailable: boolean | null;
  isPurchased: boolean | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    article: string | null;
    pricePair: number;
    sizes: any;
    isActive: boolean;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
      color: string | null;
    }>;
    provider: {
      id: string;
      name: string;
      phone: string | null;
      place: string | null;
      location: string | null;
    } | null;
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
  address: string | null;
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState<{
    images: Array<{ id: string; url: string; alt: string | null }>;
    productName: string;
    initialIndex: number;
  } | null>(null);
  const [addProductsModalOpen, setAddProductsModalOpen] = useState(false);
  const [gruzchiks, setGruzchiks] = useState<
    Array<{ id: string; name: string | null; phone: string | null }>
  >([]);
  const [purchasedFilter, setPurchasedFilter] = useState<string>('all'); // 'all' | 'purchased' | 'not-purchased'
  const [availableFilter, setAvailableFilter] = useState<string>('all'); // 'all' | 'available' | 'not-available'

  // Separate state for checkbox UI (immediate) and functionality (deferred)
  const [showImagesCheckbox, setShowImagesCheckbox] = useState<boolean>(false);
  const [showImages, setShowImages] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const checkboxInputRef = useRef<HTMLInputElement | null>(null);
  const updateScheduledRef = useRef<boolean>(false);

  // Get unread counts for all items in this order
  const { getUnreadCount, refetch: refetchUnreadCounts } =
    useAdminOrderUnreadCounts(orderId);

  // Confirmation modal for item deletion
  const confirmationModal = useConfirmationModal();

  // Load showImages preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('admin-orders-show-images');
    if (savedPreference !== null) {
      const value = savedPreference === 'true';
      setShowImagesCheckbox(value);
      setShowImages(value);
    }
  }, []);

  // Handler: update checkbox state immediately, defer heavy React work
  const handleShowImagesChange = useCallback(
    (checked: boolean) => {
      // Update checkbox visual state IMMEDIATELY - this is synchronous
      setShowImagesCheckbox(checked);

      // Defer heavy React work (image rendering) to next tick
      if (!updateScheduledRef.current) {
        updateScheduledRef.current = true;
        setTimeout(() => {
          startTransition(() => {
            setShowImages(checked);
            updateScheduledRef.current = false;
          });
          localStorage.setItem('admin-orders-show-images', String(checked));
        }, 0);
      }
    },
    [startTransition]
  );

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const [orderResponse, gruzchiksResponse] = await Promise.all([
          fetch(`/api/admin/orders/${orderId}`),
          fetch('/api/admin/orders?limit=1'), // Just to get gruzchiks list
        ]);

        if (!orderResponse.ok) {
          throw new Error('Failed to fetch order details');
        }
        const orderData = await orderResponse.json();
        setOrder(orderData.order);

        if (gruzchiksResponse.ok) {
          const gruzchiksData = await gruzchiksResponse.json();
          setGruzchiks(gruzchiksData.gruzchiks || []);
        }
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
        className="!border-orange-400 !bg-orange-400 !text-white hover:!bg-orange-500"
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

  const getPurchaseBadge = (isPurchased: boolean | null) => {
    if (isPurchased === null) {
      return (
        <Badge
          variant="outline"
          className="border-gray-300 bg-gray-50 text-gray-600"
        >
          Не указано
        </Badge>
      );
    }
    return isPurchased ? (
      <Badge
        variant="outline"
        className="!border-green-400 !bg-green-400 !text-white hover:!bg-green-500"
      >
        Куплено
      </Badge>
    ) : (
      <Badge
        variant="default"
        className="border-red-500 bg-red-500 text-white hover:bg-red-600"
      >
        Не куплено
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
          {sizes.map((size: any, index: number) => {
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
                className="flex aspect-square w-8 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-xs"
              >
                <span className="font-medium text-gray-900">
                  {sizeValue}
                </span>
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-purple-100 text-[10px] font-medium text-purple-700">
                  {countValue}
                </span>
              </div>
            );
          })}
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

  const handleOrderUpdate = async (updates: {
    status?: string;
    gruzchikId?: string | null;
  }) => {
    if (!order) return;

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      const data = await response.json();
      // Update local state
      setOrder(prev => {
        if (!prev) return null;
        const updatedOrder = { ...prev, ...updates };
        if (updates.gruzchikId !== undefined) {
          if (updates.gruzchikId) {
            const selectedGruzchik = gruzchiks.find(
              g => g.id === updates.gruzchikId
            );
            updatedOrder.gruzchik = selectedGruzchik
              ? { id: selectedGruzchik.id, name: selectedGruzchik.name }
              : null;
            updatedOrder.gruzchikId = updates.gruzchikId;
          } else {
            updatedOrder.gruzchik = null;
            updatedOrder.gruzchikId = null;
          }
        }
        return updatedOrder;
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      alert(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const confirmed = await confirmationModal.showConfirmation({
      title: 'Удалить товар из заказа?',
      message: `Вы уверены, что хотите удалить "${itemName}" из заказа? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      confirmationModal.setLoading(true);
      const response = await fetch(`/api/admin/order-items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }

      // Refresh order data
      const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }

      confirmationModal.closeModal();
    } catch (error) {
      console.error('Failed to delete order item:', error);
      confirmationModal.setLoading(false);
      alert(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleImageClick = (item: OrderItem, imageIndex: number = 0) => {
    if (item.product.images && item.product.images.length > 0) {
      // Normalize color strings for comparison (trim and lowercase)
      const normalize = (s?: string | null) => (s || '').trim().toLowerCase();
      const itemColor = normalize(item.color);

      // Filter images to only show the ones matching the item's color
      const filteredImages = item.product.images.filter(
        img => normalize(img.color) === itemColor
      );

      // If no color match, fall back to all images
      const images =
        filteredImages.length > 0 ? filteredImages : item.product.images;

      // Always start at first image since we filtered
      const initialIndex = 0;

      setSelectedItemImages({
        images,
        productName: item.name,
        initialIndex,
      });
      setImageModalOpen(true);
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
    <div className="flex h-full flex-col space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="mt-1 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                Заказ {formatOrderNumber(order.orderNumber)}
              </h1>
              <EditableStatusBadge
                status={order.status || 'Новый'}
                onStatusChange={async newStatus =>
                  handleOrderUpdate({ status: newStatus })
                }
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Клиент */}
        <Card className="border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Клиент
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.user?.label && (
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {order.user.label}
                </span>
              </div>
            )}
            {order.fullName && (
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {order.fullName}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.phone}
            </p>
          </CardContent>
        </Card>

        {/* Сумма */}
        <Card className="border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Сумма
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(order.total)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Оплата:{' '}
              <span className="font-medium">{formatPrice(order.payment)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Грузчик */}
        <Card className="border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
                <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Грузчик
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <EditableGruzchikSelector
              value={order.gruzchikId}
              gruzchiks={gruzchiks}
              onGruzchikChange={async newGruzchikId =>
                handleOrderUpdate({ gruzchikId: newGruzchikId })
              }
            />
          </CardContent>
        </Card>

        {/* Транспортная компания */}
        <Card className="border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Доставка
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {order.transportOptions && order.transportOptions.length > 0
                ? order.transportOptions
                    .map(opt => opt.transportName)
                    .join(', ')
                : order.transportName || (
                    <span className="text-gray-400 dark:text-gray-500">
                      Не выбрана
                    </span>
                  )}
            </p>
            {order.address && (
              <div className="border-t border-gray-100 pt-2 dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Адрес доставки
                    </p>
                    <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                      {order.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Товары в заказе
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                onClick={() => setAddProductsModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Добавить товары
              </Button>
              <div className="flex items-center gap-2">
                <Checkbox
                  ref={checkboxInputRef}
                  id="show-images"
                  checked={showImagesCheckbox}
                  onCheckedChange={handleShowImagesChange}
                />
                <label
                  htmlFor="show-images"
                  className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Показывать картинки
                </label>
              </div>
              <Select
                value={purchasedFilter}
                onValueChange={setPurchasedFilter}
              >
                <SelectTrigger
                  className="w-full sm:w-48"
                  aria-label="Фильтр по покупке"
                >
                  <SelectValue placeholder="Все товары" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все товары</SelectItem>
                  <SelectItem value="purchased">Куплено</SelectItem>
                  <SelectItem value="not-purchased">Не куплено</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={availableFilter}
                onValueChange={setAvailableFilter}
              >
                <SelectTrigger
                  className="w-full sm:w-48"
                  aria-label="Фильтр по наличию"
                >
                  <SelectValue placeholder="Все товары" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все товары</SelectItem>
                  <SelectItem value="available">В наличии</SelectItem>
                  <SelectItem value="not-available">Нет в наличии</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            // Filter items based on selected filters
            const filteredItems = order.items.filter(item => {
              // Filter by purchased status
              if (purchasedFilter === 'purchased') {
                if (item.isPurchased !== true) return false;
              } else if (purchasedFilter === 'not-purchased') {
                // Include items that are false or null (not purchased)
                if (item.isPurchased === true) return false;
              }

              // Filter by available status
              if (availableFilter === 'available') {
                if (item.isAvailable !== true) return false;
              } else if (availableFilter === 'not-available') {
                // Include items that are false or null (not available)
                if (item.isAvailable === true) return false;
              }

              return true;
            });

            return (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Нет товаров, соответствующих выбранным фильтрам
                      </div>
                    ) : (
                      filteredItems.map(item => (
                        <div
                          key={item.id}
                          className={cn(
                            'bg-white px-4 py-4 dark:bg-gray-800',
                            (order.status === 'Куплен' ||
                              item.isPurchased === true) &&
                              'bg-green-50 dark:bg-green-950/20',
                            item.isAvailable === true &&
                              !(
                                order.status === 'Куплен' ||
                                item.isPurchased === true
                              ) &&
                              'bg-orange-50 dark:bg-orange-950/20'
                          )}
                        >
                          <div className="space-y-4">
                            {/* Item Header */}
                            <div className="flex items-start gap-3">
                              {/* Images - show 2 images side by side, filtered by ordered color */}
                              <div className="flex shrink-0 gap-1">
                                {(() => {
                                  // Normalize color strings for comparison (trim and lowercase)
                                  const normalize = (s?: string | null) =>
                                    (s || '').trim().toLowerCase();
                                  const itemColor = normalize(item.color);

                                  // Filter images to only show the ones matching the item's color
                                  const filteredImages =
                                    item.product.images.filter(
                                      img => normalize(img.color) === itemColor
                                    );

                                  // If no color match, fall back to all images
                                  const imagesToShow =
                                    filteredImages.length > 0
                                      ? filteredImages
                                      : item.product.images;
                                  const visibleImages = imagesToShow.slice(
                                    0,
                                    2
                                  );
                                  const extraCount =
                                    imagesToShow.length - visibleImages.length;

                                  return visibleImages.map(
                                    (image, imgIndex) => {
                                      const isLastVisible =
                                        imgIndex === visibleImages.length - 1;
                                      const shouldShowOverlay =
                                        extraCount > 0 && isLastVisible;
                                      // Find the original index in the full images array for the carousel
                                      const originalIndex =
                                        item.product.images.findIndex(
                                          img => img.id === image.id
                                        );

                                      return (
                                        <div
                                          key={image.id}
                                          className="relative h-16 w-16"
                                        >
                                          <div
                                            className={cn(
                                              'relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-80 dark:bg-gray-700',
                                              !item.product.isActive &&
                                                'opacity-50 grayscale'
                                            )}
                                            onClick={() =>
                                              handleImageClick(
                                                item,
                                                originalIndex >= 0
                                                  ? originalIndex
                                                  : 0
                                              )
                                            }
                                          >
                                            <Image
                                              src={image.url}
                                              alt={image.alt || item.name}
                                              width={64}
                                              height={64}
                                              className="h-full w-full object-cover"
                                            />
                                            {/* Photo count overlay - same as ImageGridItem */}
                                            {shouldShowOverlay && (
                                              <button
                                                type="button"
                                                onClick={e => {
                                                  e.stopPropagation();
                                                  handleImageClick(
                                                    item,
                                                    originalIndex >= 0
                                                      ? originalIndex
                                                      : 0
                                                  );
                                                }}
                                                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-black/60 text-xs font-semibold text-white backdrop-blur-sm"
                                              >
                                                +{extraCount}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  );
                                })()}
                                {item.product.images.length === 0 && (
                                  <div className="relative h-16 w-16">
                                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
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
                                  </div>
                                )}
                              </div>

                              {/* Item Info */}
                              <div className="min-w-0 flex-1">
                                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  <Link
                                    href={{
                                      pathname: `/product/${item.product.slug}`,
                                      query: item.color
                                        ? { color: item.color }
                                        : {},
                                    }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1.5 transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                  >
                                    <span>{item.name}</span>
                                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                                  </Link>
                                </h3>
                                {item.itemCode && (
                                  <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                                    Код: {item.itemCode}
                                  </div>
                                )}
                                {item.product.article && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Артикул: {item.product.article}
                                  </div>
                                )}
                                {item.product.provider && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300">
                                        Поставщик: {item.product.provider.name}
                                      </span>
                                    </div>
                                    {item.product.provider.phone && (
                                      <div className="flex items-center gap-1.5 pl-5">
                                        <Phone className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {item.product.provider.phone}
                                        </span>
                                      </div>
                                    )}
                                    {(item.product.provider.place ||
                                      item.product.provider.location) && (
                                      <div className="flex items-start gap-1.5 pl-5">
                                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {[
                                            item.product.provider.place,
                                            item.product.provider.location,
                                          ]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Количество
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {item.qty} шт.
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Наличие
                                </div>
                                <div>
                                  {getAvailabilityBadge(item.isAvailable)}
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Куплено
                                </div>
                                <div>{getPurchaseBadge(item.isPurchased)}</div>
                              </div>
                            </div>

                            {/* Sizes */}
                            <div>
                              <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                Размеры
                              </div>
                              {renderSizes(item.product.sizes)}
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                              <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  За пару
                                </div>
                                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatPrice(item.product.pricePair)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  За коробку
                                </div>
                                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatPrice(item.priceBox)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Сумма
                                </div>
                                <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                                  {formatPrice(item.priceBox * item.qty)}
                                </div>
                              </div>
                            </div>

                            {/* Feedback and Messages */}
                            <div className="space-y-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                              <div>
                                <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
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
                                        <div className="mb-1 flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                              Предложена замена
                                            </span>
                                          </div>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                          <Button
                                            onClick={() => {
                                              setSelectedItemForReplacement(
                                                item
                                              );
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
                                                confirm(
                                                  'Удалить предложение о замене?'
                                                )
                                              ) {
                                                handleReplacementDelete(
                                                  replacement.id
                                                );
                                              }
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="h-7 flex-1 border-red-200 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
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
                                <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
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
                                    attachments: message.attachments,
                                  }))}
                                  maxLength={100}
                                  showImages={showImages}
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                              <ChatButtonWithIndicator
                                itemId={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                unreadCount={
                                  getUnreadCount(item.id).unreadCount
                                }
                              />
                              <Button
                                onClick={() => handleReplacementProposal(item)}
                                variant="outline"
                                size="sm"
                                className="flex flex-1 items-center justify-center gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                <span>Предложить замену</span>
                              </Button>
                              <Button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  {filteredItems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Нет товаров, соответствующих выбранным фильтрам
                    </div>
                  ) : (
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
                              Поставщик
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
                              Куплено
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
                          {filteredItems.map(item => (
                            <tr
                              key={item.id}
                              className={cn(
                                'hover:bg-gray-50 dark:hover:bg-gray-800',
                                (order.status === 'Куплен' ||
                                  item.isPurchased === true) &&
                                  'bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30',
                                item.isAvailable === true &&
                                  !(
                                    order.status === 'Куплен' ||
                                    item.isPurchased === true
                                  ) &&
                                  'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30'
                              )}
                            >
                              <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                {item.itemCode || '—'}
                              </td>
                              <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                                <div className="flex gap-1">
                                  {(() => {
                                    // Normalize color strings for comparison (trim and lowercase)
                                    const normalize = (s?: string | null) =>
                                      (s || '').trim().toLowerCase();
                                    const itemColor = normalize(item.color);

                                    // Filter images to only show the ones matching the item's color
                                    const filteredImages =
                                      item.product.images.filter(
                                        img =>
                                          normalize(img.color) === itemColor
                                      );

                                    // If no color match, fall back to all images
                                    const imagesToShow =
                                      filteredImages.length > 0
                                        ? filteredImages
                                        : item.product.images;
                                    const visibleImages = imagesToShow.slice(
                                      0,
                                      2
                                    );
                                    const extraCount =
                                      imagesToShow.length -
                                      visibleImages.length;

                                    return visibleImages.map(
                                      (image, imgIndex) => {
                                        const isLastVisible =
                                          imgIndex === visibleImages.length - 1;
                                        const shouldShowOverlay =
                                          extraCount > 0 && isLastVisible;
                                        // Find the original index in the full images array for the carousel
                                        const originalIndex =
                                          item.product.images.findIndex(
                                            img => img.id === image.id
                                          );

                                        return (
                                          <div
                                            key={image.id}
                                            className="relative h-12 w-12"
                                          >
                                            <div
                                              className={cn(
                                                'relative h-12 w-12 cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-80',
                                                !item.product.isActive &&
                                                  'opacity-50 grayscale'
                                              )}
                                              onClick={() =>
                                                handleImageClick(
                                                  item,
                                                  originalIndex >= 0
                                                    ? originalIndex
                                                    : 0
                                                )
                                              }
                                            >
                                              <Image
                                                src={image.url}
                                                alt={image.alt || item.name}
                                                width={48}
                                                height={48}
                                                className="h-12 w-12 rounded-lg object-cover"
                                              />
                                              {/* Photo count overlay - same as ImageGridItem */}
                                              {shouldShowOverlay && (
                                                <button
                                                  type="button"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleImageClick(
                                                      item,
                                                      originalIndex >= 0
                                                        ? originalIndex
                                                        : 0
                                                    );
                                                  }}
                                                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-black/60 text-xs font-semibold text-white backdrop-blur-sm"
                                                >
                                                  +{extraCount}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    );
                                  })()}
                                  {item.product.images.length === 0 && (
                                    <div
                                      className={cn(
                                        'h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700',
                                        !item.product.isActive && 'opacity-50'
                                      )}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                <Link
                                  href={{
                                    pathname: `/product/${item.product.slug}`,
                                    query: item.color
                                      ? { color: item.color }
                                      : {},
                                  }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-1.5 transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                >
                                  <span>{item.name}</span>
                                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                                </Link>
                              </td>
                              <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                                {item.product.article || '—'}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                                {item.product.provider ? (
                                  <div className="min-w-[200px] space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {item.product.provider.name}
                                      </span>
                                    </div>
                                    {item.product.provider.phone && (
                                      <div className="flex items-center gap-1.5 pl-5">
                                        <Phone className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {item.product.provider.phone}
                                        </span>
                                      </div>
                                    )}
                                    {(item.product.provider.place ||
                                      item.product.provider.location) && (
                                      <div className="flex items-start gap-1.5 pl-5">
                                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                                          {[
                                            item.product.provider.place,
                                            item.product.provider.location,
                                          ]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">
                                    —
                                  </span>
                                )}
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
                                {getPurchaseBadge(item.isPurchased)}
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
                                                setSelectedItemForReplacement(
                                                  item
                                                );
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
                                                  confirm(
                                                    'Удалить предложение о замене?'
                                                  )
                                                ) {
                                                  handleReplacementDelete(
                                                    replacement.id
                                                  );
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
                                    attachments: message.attachments,
                                  }))}
                                  maxLength={50}
                                  showImages={showImages}
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
                                    unreadCount={
                                      getUnreadCount(item.id).unreadCount
                                    }
                                  />
                                  <Button
                                    onClick={() =>
                                      handleReplacementProposal(item)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center space-x-1"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    <span className="text-xs">Замена</span>
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteItem(item.id, item.name)}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                                    title="Удалить товар из заказа"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
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

      {/* Image Carousel Modal */}
      {selectedItemImages && (
        <ProductImageModal
          isOpen={imageModalOpen}
          onClose={() => {
            setImageModalOpen(false);
            setSelectedItemImages(null);
          }}
          images={selectedItemImages.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            isPrimary: false,
          }))}
          productName={selectedItemImages.productName}
          initialIndex={selectedItemImages.initialIndex}
        />
      )}

      {/* Confirmation Modal for Item Deletion */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.handleCancel}
        onConfirm={confirmationModal.handleConfirm}
        title={confirmationModal.options.title}
        message={confirmationModal.options.message}
        confirmText={confirmationModal.options.confirmText}
        cancelText={confirmationModal.options.cancelText}
        variant={confirmationModal.options.variant}
        isLoading={confirmationModal.isLoading}
      />

      {/* Add Products Modal */}
      <AddProductsToOrderModal
        isOpen={addProductsModalOpen}
        onClose={() => setAddProductsModalOpen(false)}
        orderId={orderId}
        onProductAdded={async () => {
          // Refresh order data
          const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            setOrder(orderData.order);
          }
        }}
      />
    </div>
  );
}
