'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { deduplicateRequest } from '@/lib/request-deduplication';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, ShoppingCart, Edit3 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SmartHeader } from '@/components/ui/SmartHeader';
import { DraggablePurchaseItemList } from '@/components/ui/DraggablePurchaseItemList';
import { PurchaseItemSortingProvider } from '@/contexts/PurchaseItemSortingContext';
import { usePurchaseItemSorting } from '@/contexts/PurchaseItemSortingContext';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import ScrollArrows from '@/components/ui/ScrollArrows';
import BulkDescriptionEditModal from '@/components/features/BulkDescriptionEditModal';
import { AdminPurchaseItemCard } from '@/components/features/AdminPurchaseItemCard';
import { AdminPurchaseDetailSkeleton } from '@/components/features/AdminPurchaseDetailSkeleton';

/** Admin layout scrolls in `[data-admin-scroll-root]`, not `window`. */
function getPurchasePageScrollContainer(): HTMLElement {
  const byData = document.querySelector('[data-admin-scroll-root]');
  if (byData instanceof HTMLElement) return byData;
  const main = document.querySelector('main');
  const parent = main?.parentElement;
  if (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return parent;
    }
  }
  return document.documentElement;
}

function commitItemsUpdatePreservingScroll(commit: () => void): void {
  const scroller = getPurchasePageScrollContainer();
  const top = scroller.scrollTop;
  const left = scroller.scrollLeft;
  flushSync(commit);
  const apply = () => {
    scroller.scrollTop = top;
    scroller.scrollLeft = left;
  };
  apply();
  // FLIP / layout + scroll anchoring can adjust after sync commit; restore again on next frames.
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

interface PurchaseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  sortIndex: number;
  color?: string | null;
  product: {
    id: string;
    slug: string;
    material?: string;
    sizes?: any;
    images: Array<{
      id: string;
      url: string;
      color?: string | null;
      isPrimary: boolean;
      sort: number;
    }>;
  };
}

interface Purchase {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
  _count: {
    items: number;
  };
}

function PurchaseDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{
    itemId: string;
    field: 'name' | 'description' | 'price' | 'sortIndex';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  /** False until `/item-descriptions` merges (bulk edit needs full text). */
  const [itemDescriptionsReady, setItemDescriptionsReady] = useState(false);

  const confirmationModal = useConfirmationModal();
  const { addNotification } = useNotifications();
  const { clearSorting, setOrderForPurchase } = usePurchaseItemSorting();

  const fetchPurchase = async () => {
    const purchaseId = params.id;
    if (!purchaseId || typeof purchaseId !== 'string') return;

    try {
      setLoading(true);
      setItemDescriptionsReady(false);

      // Phase 1: small JSON (no per-item descriptions) — ends spinner quickly.
      const liteRes = await fetch(`/api/admin/purchases/${purchaseId}?lite=1`);
      if (!liteRes.ok) {
        throw new Error('Failed to fetch purchase');
      }
      const data = await liteRes.json();

      const itemsNormalized: PurchaseItem[] = data.items.map(
        (i: PurchaseItem & { description?: string }) => ({
          ...i,
          description: typeof i.description === 'string' ? i.description : '',
        })
      );

      const itemsWithSequentialIndexes = recalculateIndexes(itemsNormalized);
      clearSorting(purchaseId);
      setPurchase({
        ...data,
        items: itemsWithSequentialIndexes,
      });

      if (
        JSON.stringify(
          itemsWithSequentialIndexes.map((i: PurchaseItem) => i.sortIndex)
        ) !==
        JSON.stringify(itemsNormalized.map((i: PurchaseItem) => i.sortIndex))
      ) {
        void updateItemIndexesIfChanged(
          itemsWithSequentialIndexes,
          itemsNormalized
        ).catch(err => console.error('Failed to sync sort indexes:', err));
      }

      if (itemsNormalized.length === 0) {
        setItemDescriptionsReady(true);
      } else {
        // Phase 2: descriptions only — large text, does not block the spinner.
        void (async () => {
          try {
            const descRes = await fetch(
              `/api/admin/purchases/${purchaseId}/item-descriptions`
            );
            if (!descRes.ok) throw new Error('Failed to fetch descriptions');
            const payload = (await descRes.json()) as {
              items: Array<{ id: string; description: string }>;
            };
            const map = new Map(
              payload.items.map(r => [r.id, r.description] as const)
            );
            setPurchase(prev => {
              if (!prev) return null;
              return {
                ...prev,
                items: prev.items.map(it => ({
                  ...it,
                  description: map.get(it.id) ?? it.description,
                })),
              };
            });
            setItemDescriptionsReady(true);
          } catch (e) {
            console.error(e);
            addNotification({
              type: 'error',
              title: 'Ошибка',
              message:
                'Не удалось загрузить описания товаров. Попробуйте обновить страницу.',
            });
          }
        })();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!purchase || purchase.items.length === 0) return;

    try {
      setIsCreatingOrder(true);
      const response = await fetch(
        `/api/admin/purchases/${params.id}/create-order`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const exportPurchase = async () => {
    if (!purchase) return;

    try {
      const response = await fetch(`/api/admin/purchases/${params.id}/export`);

      if (!response.ok) {
        throw new Error('Failed to export purchase');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `purchase-export-${purchase.name}-${
            new Date().toISOString().split('T')[0]
          }.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: 'Экспорт завершен',
        message: 'Файл выгрузки успешно скачан',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка экспорта',
        message:
          err instanceof Error
            ? err.message
            : 'Не удалось экспортировать закупку',
      });
    }
  };

  const startFieldEdit = (
    itemId: string,
    field: 'name' | 'description' | 'price' | 'sortIndex',
    currentValue: string | number
  ) => {
    setEditingField({ itemId, field });
    setEditValue(String(currentValue));
  };

  const cancelFieldEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const recalculateIndexes = (
    items: PurchaseItem[],
    targetItemId?: string,
    newIndex?: number
  ) => {
    const n = items.length;
    if (n === 0) return items;

    // Use explicit numeric checks — `&& newIndex` was wrong for 0 (falsy).
    if (
      targetItemId != null &&
      newIndex != null &&
      typeof newIndex === 'number' &&
      Number.isFinite(newIndex)
    ) {
      const clampedSlot = Math.max(1, Math.min(Math.floor(newIndex), n));
      const itemsCopy = [...items];
      const targetItem = itemsCopy.find(item => item.id === targetItemId);

      if (targetItem) {
        const otherItems = itemsCopy.filter(item => item.id !== targetItemId);
        otherItems.splice(clampedSlot - 1, 0, targetItem);
        return otherItems.map((row, index) => ({
          ...row,
          sortIndex: index + 1,
        }));
      }
    }

    return [...items]
      .sort(
        (a, b) =>
          a.sortIndex - b.sortIndex || String(a.id).localeCompare(String(b.id))
      )
      .map((item, index) => ({
        ...item,
        sortIndex: index + 1,
      }));
  };

  /** Persist sort order in one request (avoids N PUTs on load/reorder). */
  const updateItemIndexesIfChanged = async (
    nextItems: PurchaseItem[],
    previousItems: PurchaseItem[]
  ) => {
    const prevSortById = new Map(previousItems.map(i => [i.id, i.sortIndex]));
    const toSync = nextItems.filter(
      item => prevSortById.get(item.id) !== item.sortIndex
    );
    if (toSync.length === 0) return;

    try {
      const response = await fetch(
        `/api/admin/purchases/${params.id}/items/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: toSync.map(item => ({
              id: item.id,
              sortIndex: item.sortIndex,
            })),
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to update sort order');
    } catch (err) {
      console.error('Failed to update item indexes:', err);
      throw err;
    }
  };

  const handleItemsReordered = async (reorderedItems: PurchaseItem[]) => {
    const previousItems = purchase?.items ?? [];
    await updateItemIndexesIfChanged(reorderedItems, previousItems);

    commitItemsUpdatePreservingScroll(() => {
      setPurchase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: reorderedItems,
        };
      });
    });
  };

  const saveFieldEdit = async () => {
    if (!editingField) return;

    try {
      setIsSaving(true);
      const item = purchase?.items.find(i => i.id === editingField.itemId);
      if (!item) return;

      // Check if the value actually changed
      let hasChanged = false;
      let newValue: string | number = editValue;

      if (
        editingField.field === 'price' ||
        editingField.field === 'sortIndex'
      ) {
        newValue = Number(editValue);
        hasChanged = newValue !== Number(item[editingField.field]);
      } else {
        hasChanged = editValue !== item[editingField.field];
      }

      // If no changes, just cancel editing without making a request
      if (!hasChanged) {
        cancelFieldEdit();
        return;
      }

      const updateData: any = {
        name: item.name,
        description: item.description,
        price: Number(item.price),
        sortIndex: item.sortIndex,
      };

      // Update the specific field
      updateData[editingField.field] = newValue;

      const response = await fetch(
        `/api/admin/purchases/${params.id}/items/${editingField.itemId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();

      if (editingField.field === 'sortIndex' && purchase) {
        const previousItems = purchase.items;
        const updatedItems = previousItems.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        );
        const recalculatedItems = recalculateIndexes(
          updatedItems,
          editingField.itemId,
          parseInt(editValue, 10)
        );

        await updateItemIndexesIfChanged(recalculatedItems, previousItems);

        setOrderForPurchase(
          purchase.id,
          recalculatedItems.map(i => i.id)
        );

        commitItemsUpdatePreservingScroll(() => {
          setPurchase(prev =>
            prev ? { ...prev, items: recalculatedItems } : null
          );
        });
      } else {
        setPurchase(prev => {
          if (!prev) return null;
          const updatedItems = prev.items.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          );
          return {
            ...prev,
            items: updatedItems,
          };
        });
      }

      cancelFieldEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyBulkDescriptions = async (options: {
    mode: 'prepend' | 'append' | 'replace';
    value?: string;
    replaceFrom?: string;
    replaceTo?: string;
  }) => {
    if (!purchase) return;
    const { mode, value, replaceFrom, replaceTo } = options;
    if (!mode) {
      setIsBulkModalOpen(false);
      return;
    }

    try {
      setIsBulkProcessing(true);
      const updates: { id: string; description: string }[] = [];

      for (const item of purchase.items) {
        let next = item.description || '';
        if (mode === 'replace' && replaceFrom) {
          try {
            next = next.split(replaceFrom).join(replaceTo ?? '');
          } catch {}
        } else if (mode === 'prepend' && value) {
          next = `${value}${next}`;
        } else if (mode === 'append' && value) {
          next = `${next}${value}`;
        }

        if (next !== item.description) {
          updates.push({ id: item.id, description: next });
        }
      }

      if (updates.length === 0) {
        addNotification({
          type: 'success',
          title: 'Готово',
          message: 'Изменений не требуется',
        });
        setIsBulkModalOpen(false);
        return;
      }

      const res = await fetch(
        `/api/admin/purchases/${params.id}/items/bulk-descriptions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updates }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to update descriptions');
      }

      const data = (await res.json()) as { items: PurchaseItem[] };
      const updatedById = new Map(data.items.map(it => [it.id, it]));

      setPurchase(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(it => updatedById.get(it.id) || it),
        };
      });

      addNotification({
        type: 'success',
        title: 'Готово',
        message: 'Описания успешно обновлены',
      });
      setIsBulkModalOpen(false);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось обновить описания',
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const confirmed = await confirmationModal.showConfirmation({
      title: 'Удалить товар из закупки?',
      message: `Вы уверены, что хотите удалить "${itemName}" из закупки?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setDeletingItemId(itemId);
      const response = await fetch(
        `/api/admin/purchases/${params.id}/items/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      const previousItems = purchase?.items ?? [];
      const remaining = previousItems.filter(item => item.id !== itemId);
      const itemsWithRecalculatedIndexes = recalculateIndexes(remaining);

      await updateItemIndexesIfChanged(itemsWithRecalculatedIndexes, remaining);

      setPurchase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: itemsWithRecalculatedIndexes,
          _count: {
            items: remaining.length,
          },
        };
      });

      confirmationModal.closeModal();
      addNotification({
        type: 'success',
        title: 'Товар удален',
        message: 'Товар успешно удален из закупки',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message:
          err instanceof Error
            ? err.message
            : 'Не удалось удалить товар из закупки',
      });
    } finally {
      setDeletingItemId(null);
      confirmationModal.setLoading(false);
    }
  };

  useEffect(() => {
    const id = params.id;
    if (!id || typeof id !== 'string') return;
    void deduplicateRequest(`admin-purchase-detail-${id}`, () =>
      fetchPurchase()
    );
  }, [params.id]);

  if (loading) {
    return <AdminPurchaseDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <Text className="mb-4 text-red-600">{error}</Text>
        <Button onClick={fetchPurchase}>Попробовать снова</Button>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="py-8 text-center">
        <Text>Закупка не найдена</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Header */}
      <SmartHeader>
        <div className="border-b bg-white px-4 py-3 sm:px-6 md:py-2.5 lg:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:gap-3 lg:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex shrink-0 items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <div className="min-w-0">
                {/* Explicit sizes: avoid Text h2's sm:text-3xl which was huge on iPad */}
                <Text
                  as="h1"
                  className="text-lg font-bold leading-tight tracking-tight sm:text-xl md:text-lg md:leading-snug lg:text-xl"
                >
                  {purchase.name}
                </Text>
                <Text className="text-muted-foreground text-sm md:text-xs md:leading-tight">
                  {purchase._count.items} товаров
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkModalOpen(true)}
                disabled={!itemDescriptionsReady}
                title={itemDescriptionsReady ? undefined : 'Загрузка описаний…'}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={exportPurchase}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Файл выгрузки
              </Button>
              <Button
                onClick={createOrder}
                disabled={purchase.items.length === 0 || isCreatingOrder}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {isCreatingOrder ? 'Создание заказа...' : 'Создать заказ'}
              </Button>
            </div>
          </div>
        </div>
      </SmartHeader>

      {/* Content with spacing for fixed SmartHeader (tablet+); extra top pad on md so first card clears header */}
      <div className="pt-0 md:pt-[5.25rem] lg:pt-20">
        {/* Items List */}
        {purchase.items.length === 0 ? (
          <Card className="p-8 text-center">
            <Text variant="h3" className="mb-2">
              Нет товаров в закупке
            </Text>
            <Text className="text-muted-foreground mb-4">
              Добавьте товары из каталога в режиме закупки
            </Text>
            <Button onClick={() => router.push('/')}>Перейти в каталог</Button>
          </Card>
        ) : (
          <DraggablePurchaseItemList
            items={purchase.items}
            purchaseId={purchase.id}
            onItemsReordered={handleItemsReordered}
          >
            {(item, isDragging) => (
              <AdminPurchaseItemCard
                item={item}
                isDragging={isDragging}
                editingField={editingField}
                editValue={editValue}
                deletingItemId={deletingItemId}
                setEditValue={setEditValue}
                saveFieldEdit={saveFieldEdit}
                cancelFieldEdit={cancelFieldEdit}
                startFieldEdit={startFieldEdit}
                onDelete={handleDeleteItem}
              />
            )}
          </DraggablePurchaseItemList>
        )}
      </div>

      {/* Confirmation Modal */}
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
      <BulkDescriptionEditModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApply={handleApplyBulkDescriptions}
        isProcessing={isBulkProcessing}
      />
      <ScrollArrows offsetBottomPx={28} showOnMobile />
    </div>
  );
}

export default function PurchaseDetailPage() {
  return (
    <PurchaseItemSortingProvider>
      <PurchaseDetailPageContent />
    </PurchaseItemSortingProvider>
  );
}
