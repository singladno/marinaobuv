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
  Package,
  Receipt,
  Loader2,
  History,
  CheckCircle2,
  Ban,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableLoader } from '@/components/ui/Loader';
import { AdminOrderItemChat } from '@/components/features/admin/AdminOrderItemChat';
import { ChatButtonWithIndicator } from '@/components/features/admin/ChatButtonWithIndicator';
import { OrderItemData } from '@/components/features/gruzchik/OrderItemCard';
import { useAdminOrderUnreadCounts } from '@/hooks/useAdminOrderUnreadCounts';
import { useOrderActivityUnread } from '@/hooks/useOrderActivityUnread';
import { EditableStatusBadge } from '@/components/features/EditableStatusBadge';
import { EditableGruzchikSelector } from '@/components/features/EditableGruzchikSelector';
import { FeedbackStatusIconsCompact } from '@/components/features/admin/FeedbackStatusIcons';
import { MessagePreviewCompact } from '@/components/features/admin/MessagePreview';
import { AdminReplacementModal } from '@/components/features/admin/AdminReplacementModal';
import { ProductImageModal } from '@/components/features/ProductImageModal';
import { AddProductsToOrderModal } from '@/components/features/admin/AddProductsToOrderModal';
import { OptimisticEditableCell } from '@/components/features/OptimisticEditableCell';
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
import { Modal } from '@/components/ui/Modal';
import { HorizontalScrollEdgeHints } from '@/components/ui/HorizontalScrollEdgeHints';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { OrderActivityHistoryModal } from '@/components/features/admin/OrderActivityHistoryModal';
import type { SupplierPollSnapshot } from '@/lib/supplier-poll-types';
import {
  pollModeShortLabel,
  supplierPollStatusLabel,
} from '@/lib/supplier-poll-ui-labels';

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
  /** См. getOrderItemReplacementAvailabilityHints (колонка «Наличие») */
  availabilityReplacementHint?:
    | 'awaiting_supplier'
    | 'no_replacement_from_supplier'
    | null;
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
  supplierPoll?: SupplierPollSnapshot;
}

function SupplierPollItemBadge({
  itemId,
  poll,
}: {
  itemId: string;
  poll: SupplierPollSnapshot | undefined;
}) {
  if (!poll?.isActive) return null;
  const s = poll.itemStatuses[itemId] ?? 'idle';
  const meta = supplierPollStatusLabel(s, true);
  if (!meta) return null;
  const cls =
    s === 'sending'
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/35 dark:text-violet-100'
      : s === 'awaiting_response'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
        : s === 'awaiting_replacement'
          ? 'bg-orange-100 text-orange-950 dark:bg-orange-950/45 dark:text-orange-100'
          : s === 'stock_resolved'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
            : s === 'not_in_active_poll'
              ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        cls
      )}
      title={meta.title}
    >
      {s === 'sending' && (
        <Loader2
          className="h-3 w-3 shrink-0 animate-spin text-violet-600 dark:text-violet-300"
          aria-hidden
        />
      )}
      {meta.short}
    </span>
  );
}

function SupplierPollColumnContent({
  item,
  poll,
  roundCompleted,
}: {
  item: OrderItem;
  poll: SupplierPollSnapshot | undefined;
  roundCompleted: boolean;
}) {
  if (poll?.isActive) {
    return <SupplierPollItemBadge itemId={item.id} poll={poll} />;
  }
  if (roundCompleted) {
    if (!item.product.provider?.phone) {
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
      );
    }
    if (item.isAvailable === null) {
      return (
        <span
          className="text-xs text-sky-800 dark:text-sky-200/90"
          title="Позиция не вошла в завершённый раунд опроса"
        >
          Вне раунда
        </span>
      );
    }
    return (
      <span
        className="inline-flex max-w-full items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
        title="Опрос по позиции завершён, наличие зафиксировано"
      >
        Наличие уточнено
      </span>
    );
  }
  return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
}

function SupplierPollMetricChip({
  label,
  value,
  title,
  emphasize,
}: {
  label: string;
  value: string | number;
  title?: string;
  /** Сильнее выделяет метрику (ожидание ответа и т.п.) */
  emphasize?: boolean;
}) {
  return (
    <span
      title={title ?? `${label}: ${value}`}
      className={cn(
        'inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs leading-tight shadow-sm',
        emphasize
          ? 'border-amber-500/70 bg-amber-100/95 ring-1 ring-amber-500/25 dark:border-amber-500/50 dark:bg-amber-950/60 dark:ring-amber-400/20'
          : 'border-amber-200/95 bg-white/[0.92] dark:border-amber-800/60 dark:bg-amber-950/40'
      )}
    >
      <span className="text-amber-900/88 font-medium dark:text-amber-200/90">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums tracking-tight text-amber-950 dark:text-amber-50">
        {value}
      </span>
    </span>
  );
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
  const [supplierPollModalOpen, setSupplierPollModalOpen] = useState(false);
  const [supplierPollLoading, setSupplierPollLoading] = useState(false);
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);
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
  const refetchUnreadCountsRef = useRef(refetchUnreadCounts);
  refetchUnreadCountsRef.current = refetchUnreadCounts;

  const [activityUnreadRefreshKey, setActivityUnreadRefreshKey] = useState(0);
  const {
    unreadCount: activityUnreadCount,
    markSeenUpTo: markOrderActivitySeen,
  } = useOrderActivityUnread(orderId, activityUnreadRefreshKey);

  // Confirmation modal for item deletion
  const confirmationModal = useConfirmationModal();
  const { addNotification } = useNotifications();

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

  const fetchOrderDetails = useCallback(
    async (options?: { silent?: boolean; includeGruzchiks?: boolean }) => {
      const silent = options?.silent ?? false;
      const includeGruzchiks = options?.includeGruzchiks ?? true;
      if (!orderId) return;
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const orderResponse = await fetch(`/api/admin/orders/${orderId}`);

        if (!orderResponse.ok) {
          throw new Error('Failed to fetch order details');
        }
        const orderData = await orderResponse.json();
        setOrder({
          ...orderData.order,
          supplierPoll: orderData.supplierPoll,
        } as OrderDetails);

        if (includeGruzchiks) {
          const gruzchiksResponse = await fetch('/api/admin/orders?limit=1');
          if (gruzchiksResponse.ok) {
            const gruzchiksData = await gruzchiksResponse.json();
            setGruzchiks(gruzchiksData.gruzchiks || []);
          }
        }
        void refetchUnreadCountsRef.current();
        setActivityUnreadRefreshKey(k => k + 1);
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch order details'
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (orderId) {
      void fetchOrderDetails({ silent: false, includeGruzchiks: true });
    }
  }, [orderId, fetchOrderDetails]);

  /** Live updates: refetch when SSE reports data version changed (no WebSocket). */
  useEffect(() => {
    if (!orderId || typeof EventSource === 'undefined') {
      return;
    }
    const es = new EventSource(`/api/admin/orders/${orderId}/stream`);
    es.onmessage = () => {
      void fetchOrderDetails({ silent: true, includeGruzchiks: false });
    };
    return () => {
      es.close();
    };
  }, [orderId, fetchOrderDetails]);

  /** While a poll round is active, poll snapshot can change before order row / version bump; refresh every few seconds (only when tab visible). */
  useEffect(() => {
    if (!orderId) return;
    const active = order?.supplierPoll?.isActive;
    if (!active) return;

    const id = window.setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }
      void fetchOrderDetails({ silent: true, includeGruzchiks: false });
    }, 3000);
    return () => window.clearInterval(id);
  }, [orderId, order?.supplierPoll?.isActive, fetchOrderDetails]);

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

  const formatLineItemsCount = (n: number) => {
    const abs100 = Math.abs(n) % 100;
    const last = Math.abs(n) % 10;
    if (abs100 >= 11 && abs100 <= 14) return `${n} позиций`;
    if (last === 1) return `${n} позиция`;
    if (last >= 2 && last <= 4) return `${n} позиции`;
    return `${n} позиций`;
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

  const renderAvailabilityColumn = (item: OrderItem) => {
    const hint = item.availabilityReplacementHint;
    return (
      <div className="flex max-w-[15rem] flex-col items-start gap-1.5">
        {getAvailabilityBadge(item.isAvailable)}
        {item.isAvailable === false && hint === 'awaiting_supplier' ? (
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-orange-300/90 bg-orange-50 px-2 py-0.5 text-[0.65rem] font-medium leading-tight text-orange-950 dark:border-orange-700/60 dark:bg-orange-950/40 dark:text-orange-100"
            title="Отправлен вопрос поставщику про аналоги; ждём ответа"
          >
            <RefreshCw
              className="h-3 w-3 shrink-0 text-orange-600 dark:text-orange-400"
              aria-hidden
            />
            Ждём аналог
          </span>
        ) : null}
        {item.isAvailable === false &&
        hint === 'no_replacement_from_supplier' ? (
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-300/90 bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium leading-tight text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            title="По опросу: аналог от поставщика не предложен (или отказ без фото-заявки)"
          >
            <Ban
              className="h-3 w-3 shrink-0 text-slate-600 dark:text-slate-400"
              aria-hidden
            />
            Замен нет
          </span>
        ) : null}
      </div>
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
                className="inline-flex min-h-[2.25rem] min-w-[2rem] flex-shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs"
              >
                <span className="whitespace-nowrap text-center font-medium text-gray-900">
                  {sizeValue}
                </span>
                <span className="flex h-3 min-w-[0.75rem] shrink-0 items-center justify-center rounded-full bg-purple-100 px-0.5 text-[10px] font-medium text-purple-700">
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
          setOrder({
            ...orderData.order,
            supplierPoll: orderData.supplierPoll,
          } as OrderDetails);
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
          setOrder({
            ...orderData.order,
            supplierPoll: orderData.supplierPoll,
          } as OrderDetails);
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
          setOrder({
            ...orderData.order,
            supplierPoll: orderData.supplierPoll,
          } as OrderDetails);
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

  const handleSupplierPoll = async (
    mode: 'STOCK_ONLY' | 'STOCK_AND_INVOICE'
  ) => {
    setSupplierPollLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/supplier-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addNotification({
          type: 'error',
          title: 'Не удалось отправить опрос',
          message:
            typeof data.error === 'string'
              ? data.error
              : 'Не удалось отправить опрос поставщикам',
        });
        return;
      }
      setSupplierPollModalOpen(false);
      addNotification({
        type: 'success',
        title: 'Опрос запущен',
      });
      const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder({
          ...orderData.order,
          supplierPoll: orderData.supplierPoll,
        } as OrderDetails);
      }
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Ошибка опроса',
        message:
          e instanceof Error ? e.message : 'Ошибка при опросе поставщиков',
      });
    } finally {
      setSupplierPollLoading(false);
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
        setOrder({
          ...orderData.order,
          supplierPoll: orderData.supplierPoll,
        } as OrderDetails);
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

  const handleOrderItemQtySave = async (
    itemId: string,
    newQty: number | null
  ) => {
    if (newQty === null || !Number.isInteger(newQty) || newQty < 1) {
      throw new Error('Укажите целое количество не меньше 1');
    }

    const response = await fetch(`/api/admin/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: newQty }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить количество');
    }

    const data = await response.json();
    setOrder(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        subtotal: data.order.subtotal,
        total: data.order.total,
        items: prev.items.map(i =>
          i.id === itemId ? { ...i, qty: newQty } : i
        ),
      };
    });
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

  const supplierRoundCompleted = Boolean(
    order.supplierPoll &&
    !order.supplierPoll.isActive &&
    'completionNotice' in order.supplierPoll &&
    order.supplierPoll.completionNotice
  );

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
    <div className="flex h-full flex-col space-y-6 px-4 py-4 sm:px-6 sm:py-8">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatLineItemsCount(order.items.length)}
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
      <Card className="mx-0 border-0 shadow-none md:mx-0 md:rounded-xl md:border md:border-gray-200 md:shadow-sm dark:md:border-gray-700">
        <CardHeader className="border-b border-gray-200 px-4 py-3 sm:p-6 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Товары в заказе
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative self-start sm:self-auto">
                <Button
                  onClick={() => setActivityHistoryOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  История действий
                </Button>
                {activityUnreadCount > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
                    aria-label={`Новых действий: ${activityUnreadCount}`}
                  >
                    {activityUnreadCount > 99 ? '99+' : activityUnreadCount}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!supplierRoundCompleted && (
                  <Button
                    onClick={() => setSupplierPollModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'flex items-center gap-2',
                      order?.supplierPoll?.isActive && 'opacity-60'
                    )}
                    disabled={
                      supplierPollLoading ||
                      Boolean(order?.supplierPoll?.isActive)
                    }
                    title={
                      order?.supplierPoll?.isActive
                        ? 'Идёт опрос: раунд закроется автоматически, когда по всем позициям в опросе уточнено наличие.'
                        : undefined
                    }
                  >
                    <MessageSquare className="h-4 w-4" />
                    Опросить поставщиков
                  </Button>
                )}
                {supplierRoundCompleted && (
                  <div
                    className="inline-flex h-8 max-w-full shrink-0 items-center gap-1.5 rounded-md border border-emerald-200/80 bg-white px-2.5 text-xs text-emerald-800 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100"
                    title="По раунду опроса получены ответы от поставщиков о наличии"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    <span className="whitespace-nowrap font-medium">
                      Опрос завершён
                    </span>
                  </div>
                )}
              </div>
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
        <CardContent
          className="!p-0"
          style={{ padding: 0 } as React.CSSProperties}
        >
          {order.supplierPoll?.isActive && (
            <div
              className={cn(
                'border-b px-4 py-3 sm:px-6',
                order.supplierPoll.outboundSending
                  ? 'border-violet-200/90 bg-violet-50 dark:border-violet-900/45 dark:bg-violet-950/20'
                  : 'border-amber-200/90 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25'
              )}
            >
              <div className="min-w-0 space-y-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    order.supplierPoll.outboundSending
                      ? 'text-violet-950 dark:text-violet-100'
                      : 'text-amber-950 dark:text-amber-100'
                  )}
                >
                  {order.supplierPoll.outboundSending
                    ? 'Отправка в WhatsApp…'
                    : 'Активный опрос поставщиков'}
                </p>
                {order.supplierPoll.outboundSending ? (
                  <p className="text-xs leading-relaxed text-violet-900/90 dark:text-violet-200/85">
                    Режим: {pollModeShortLabel(order.supplierPoll.mode)}.
                    Сообщения и фото поставщикам уходят в фоне; можно перейти на
                    другую страницу — процесс не прервётся. Здесь и в колонке
                    «Статус опрос» статус обновится, когда раунд перейдёт к
                    ожиданию ответов.
                  </p>
                ) : (
                  <div
                    className="flex flex-wrap items-center gap-2 pt-0.5"
                    aria-label="Сводка по активному опросу"
                  >
                    <SupplierPollMetricChip
                      label="Режим"
                      value={pollModeShortLabel(order.supplierPoll.mode)}
                      title="Режим опроса (наличие / наличие и счёт)"
                    />
                    <SupplierPollMetricChip
                      label="В раунде"
                      value={`${order.supplierPoll.polledCount} поз.`}
                      title="Позиций, попавших в текущий раунд опроса"
                    />
                    <SupplierPollMetricChip
                      label="Наличие уточнено"
                      value={order.supplierPoll.resolvedCount}
                      title="Позиций, по которым уже зафиксировано наличие (без открытой ветки «ждём аналог»)"
                    />
                    <SupplierPollMetricChip
                      label="Ждём наличие"
                      value={order.supplierPoll.awaitingCount}
                      title="Позиции без ответа поставщика по наличию (isAvailable ещё не задан)"
                      emphasize={order.supplierPoll.awaitingCount > 0}
                    />
                    <SupplierPollMetricChip
                      label="Ждём замену"
                      value={order.supplierPoll.replacementAwaitingCount ?? 0}
                      title="После «нет в наличии» ждём ответ поставщика по аналогам"
                      emphasize={
                        (order.supplierPoll.replacementAwaitingCount ?? 0) > 0
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
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
                  <div className="space-y-1">
                    {filteredItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Нет товаров, соответствующих выбранным фильтрам
                      </div>
                    ) : (
                      filteredItems.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className={cn(
                            'bg-white px-4 py-3 dark:bg-gray-800',
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
                          <div className="space-y-3 sm:space-y-4">
                            {/* Item Header */}
                            <div className="flex items-start gap-2 sm:gap-3">
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
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  <Link
                                    href={{
                                      pathname: `/product/${item.product.slug}`,
                                      query: item.color
                                        ? { color: item.color }
                                        : {},
                                    }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-start gap-1.5 transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                  >
                                    <span className="break-words">
                                      {item.name}
                                    </span>
                                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                                  </Link>
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                                  {item.itemCode && (
                                    <span>Код: {item.itemCode}</span>
                                  )}
                                  {item.product.article && (
                                    <span>Артикул: {item.product.article}</span>
                                  )}
                                </div>
                                {(order.supplierPoll?.isActive ||
                                  supplierRoundCompleted) && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      Опрос
                                    </span>
                                    <SupplierPollColumnContent
                                      item={item}
                                      poll={order.supplierPoll}
                                      roundCompleted={supplierRoundCompleted}
                                    />
                                  </div>
                                )}
                                {item.product.provider && (
                                  <div className="space-y-1 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300">
                                        {item.product.provider.name}
                                      </span>
                                    </div>
                                    {item.product.provider.phone && (
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {item.product.provider.phone}
                                        </span>
                                      </div>
                                    )}
                                    {(item.product.provider.place ||
                                      item.product.provider.location) && (
                                      <div className="flex items-start gap-1.5">
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
                                )}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  № {itemIndex + 1} · Количество
                                </div>
                                <div className="flex max-w-[11rem] flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                  <OptimisticEditableCell
                                    value={item.qty}
                                    onSave={async v => {
                                      const n =
                                        typeof v === 'number' ? v : Number(v);
                                      await handleOrderItemQtySave(item.id, n);
                                    }}
                                    type="number"
                                    min={1}
                                    step="1"
                                    className="font-semibold"
                                    aria-label={`Количество, позиция ${itemIndex + 1}`}
                                  />
                                  <span className="text-gray-500 dark:text-gray-400">
                                    шт.
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Наличие
                                </div>
                                <div>{renderAvailabilityColumn(item)}</div>
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
                                onClick={() =>
                                  handleDeleteItem(item.id, item.name)
                                }
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
                    <HorizontalScrollEdgeHints className="h-full">
                      <table className="w-full min-w-max border-collapse">
                        {/* Header */}
                        <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                              №
                            </th>
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
                              Опрос
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
                          {filteredItems.map((item, itemIndex) => (
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
                              <td className="whitespace-nowrap border-b border-gray-200 px-4 py-4 text-center text-sm tabular-nums text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                {itemIndex + 1}
                              </td>
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
                              <td className="border-b border-gray-200 px-4 py-4 align-middle dark:border-gray-700">
                                {order.supplierPoll?.isActive ||
                                supplierRoundCompleted ? (
                                  <div className="flex max-w-[10rem] items-center">
                                    <SupplierPollColumnContent
                                      item={item}
                                      poll={order.supplierPoll}
                                      roundCompleted={supplierRoundCompleted}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                                <div className="min-w-[5rem] max-w-[8rem]">
                                  <OptimisticEditableCell
                                    value={item.qty}
                                    onSave={async v => {
                                      const n =
                                        typeof v === 'number' ? v : Number(v);
                                      await handleOrderItemQtySave(item.id, n);
                                    }}
                                    type="number"
                                    min={1}
                                    step="1"
                                    className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100"
                                    aria-label={`Количество, строка ${itemIndex + 1}`}
                                  />
                                </div>
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                                {renderSizes(item.product.sizes)}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 align-top dark:border-gray-700">
                                {renderAvailabilityColumn(item)}
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
                                    onClick={() =>
                                      handleDeleteItem(item.id, item.name)
                                    }
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
                    </HorizontalScrollEdgeHints>
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

      <OrderActivityHistoryModal
        isOpen={activityHistoryOpen}
        onClose={() => setActivityHistoryOpen(false)}
        orderId={orderId}
        onHistorySeen={markOrderActivitySeen}
      />

      <Modal
        isOpen={supplierPollModalOpen}
        onClose={() => setSupplierPollModalOpen(false)}
        title="Опрос поставщиков"
        size="md"
      >
        <div className="px-6 pb-6 pt-1">
          <div className="mb-6 mt-4 flex gap-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50/80 p-4 dark:border-gray-700/80 dark:from-gray-900/60 dark:to-slate-900/40">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800 dark:ring-gray-600">
              <MessageSquare className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                WhatsApp · по одному чату на поставщика
              </p>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Для каждой позиции уйдёт фото с подписью количества, затем общий
                вопрос о наличии. Ответы обрабатываются автоматически.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
              Выберите сценарий
            </p>
            <button
              type="button"
              disabled={supplierPollLoading}
              onClick={() => handleSupplierPoll('STOCK_ONLY')}
              className={cn(
                'group w-full cursor-pointer rounded-xl border bg-white p-4 text-left transition-all',
                'border-gray-200 shadow-sm hover:border-violet-300 hover:shadow-md',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
                'dark:border-gray-600 dark:bg-gray-900/80 dark:hover:border-violet-500/45',
                'disabled:cursor-not-allowed',
                supplierPollLoading && 'pointer-events-none opacity-60'
              )}
            >
              <div className="flex gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                    'bg-violet-100 text-violet-700',
                    'group-hover:bg-violet-200/90 dark:bg-violet-950/80 dark:text-violet-300 dark:group-hover:bg-violet-900/70'
                  )}
                >
                  <Package className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    Только наличие
                  </div>
                  <p className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">
                    Спросить, есть ли выбранные модели на складе
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={supplierPollLoading}
              onClick={() => handleSupplierPoll('STOCK_AND_INVOICE')}
              className={cn(
                'group w-full cursor-pointer rounded-xl border bg-white p-4 text-left transition-all',
                'border-gray-200 shadow-sm hover:border-emerald-400/70 hover:shadow-md',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
                'dark:border-gray-600 dark:bg-gray-900/80 dark:hover:border-emerald-500/40',
                'disabled:cursor-not-allowed',
                supplierPollLoading && 'pointer-events-none opacity-60'
              )}
            >
              <div className="flex gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                    'bg-emerald-50 text-emerald-700',
                    'group-hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:group-hover:bg-emerald-900/50'
                  )}
                >
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    Наличие и счёт
                  </div>
                  <p className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">
                    То же + попросить выставить счёт на оплату
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

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
            setOrder({
              ...orderData.order,
              supplierPoll: orderData.supplierPoll,
            } as OrderDetails);
          }
        }}
      />
    </div>
  );
}
