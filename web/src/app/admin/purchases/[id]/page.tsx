'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  ShoppingCart,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  GripVertical,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SmartHeader } from '@/components/ui/SmartHeader';
import { DraggablePurchaseItemList } from '@/components/ui/DraggablePurchaseItemList';
import { PurchaseItemSortingProvider } from '@/contexts/PurchaseItemSortingContext';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface PurchaseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  sortIndex: number;
  product: {
    id: string;
    slug: string;
    material?: string;
    sizes?: any;
    images: Array<{
      id: string;
      url: string;
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
  const [editingItem, setEditingItem] = useState<PurchaseItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editSortIndex, setEditSortIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<{
    itemId: string;
    field: 'name' | 'description' | 'price' | 'sortIndex';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const confirmationModal = useConfirmationModal();
  const { addNotification } = useNotifications();

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/purchases/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase');
      }
      const data = await response.json();
      // Ensure items have sequential indexes starting from 1
      const itemsWithSequentialIndexes = recalculateIndexes(data.items);
      if (
        JSON.stringify(
          itemsWithSequentialIndexes.map((i: PurchaseItem) => i.sortIndex)
        ) !== JSON.stringify(data.items.map((i: PurchaseItem) => i.sortIndex))
      ) {
        // Indexes need to be updated in database
        await updateItemIndexes(itemsWithSequentialIndexes);
      }
      setPurchase({
        ...data,
        items: itemsWithSequentialIndexes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!editingItem) return;

    try {
      setIsSaving(true);

      // Check if any values actually changed
      const hasNameChanged = editName !== editingItem.name;
      const hasDescriptionChanged = editDescription !== editingItem.description;
      const hasPriceChanged = editPrice !== Number(editingItem.price);
      const hasSortIndexChanged = editSortIndex !== editingItem.sortIndex;

      // If no changes, just close modal without making a request
      if (
        !hasNameChanged &&
        !hasDescriptionChanged &&
        !hasPriceChanged &&
        !hasSortIndexChanged
      ) {
        setEditingItem(null);
        return;
      }

      const response = await fetch(
        `/api/admin/purchases/${params.id}/items/${editingItem.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName,
            description: editDescription,
            price: editPrice,
            sortIndex: editSortIndex,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setPurchase(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        );

        // Only recalculate indexes if sortIndex was changed
        if (hasSortIndexChanged) {
          const recalculatedItems = recalculateIndexes(updatedItems);
          // Update indexes in database only when sort order changes
          updateItemIndexes(recalculatedItems);
          return {
            ...prev,
            items: recalculatedItems,
          };
        } else {
          // For other fields, just update the single item
          return {
            ...prev,
            items: updatedItems,
          };
        }
      });
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    const confirmed = await confirmationModal.showConfirmation({
      title: 'Подтверждение удаления',
      message:
        'Вы уверены, что хотите удалить этот товар из закупки? Это действие нельзя отменить.',
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

      setPurchase(prev => {
        if (!prev) return null;
        const remainingItems = prev.items.filter(item => item.id !== itemId);
        const recalculatedItems = recalculateIndexes(remainingItems);

        // Update indexes in database
        updateItemIndexes(recalculatedItems);

        return {
          ...prev,
          items: recalculatedItems,
          _count: {
            ...prev._count,
            items: recalculatedItems.length,
          },
        };
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка при удалении',
        message: err instanceof Error ? err.message : 'Failed to delete item',
      });
    } finally {
      setDeletingItemId(null);
      confirmationModal.setLoading(false);
      confirmationModal.closeModal();
    }
  };

  const createOrder = async () => {
    if (!purchase || purchase.items.length === 0) return;

    try {
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
    }
  };

  const openEditModal = (item: PurchaseItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditPrice(Number(item.price));
    setEditSortIndex(item.sortIndex);
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
    if (targetItemId && newIndex) {
      // Handle position insertion - if new index conflicts, shift other items
      const itemsCopy = [...items];
      const targetItem = itemsCopy.find(item => item.id === targetItemId);

      if (targetItem) {
        // Remove the target item temporarily
        const otherItems = itemsCopy.filter(item => item.id !== targetItemId);

        // Insert the target item at the desired position
        otherItems.splice(newIndex - 1, 0, targetItem);

        // Reassign sequential indexes
        otherItems.forEach((item, index) => {
          item.sortIndex = index + 1;
        });

        return otherItems;
      }
    }

    // Fallback to simple sequential ordering
    return items
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((item, index) => ({
        ...item,
        sortIndex: index + 1,
      }));
  };

  const updateItemIndexes = async (items: PurchaseItem[]) => {
    try {
      // Update all items with new sequential indexes
      const updatePromises = items.map((item, index) =>
        fetch(`/api/admin/purchases/${params.id}/items/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sortIndex: index + 1,
          }),
        })
      );

      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Failed to update item indexes:', err);
    }
  };

  const handleItemsReordered = async (reorderedItems: PurchaseItem[]) => {
    // Update the database
    await updateItemIndexes(reorderedItems);

    // Update the local state immediately for UI
    setPurchase(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: reorderedItems,
      };
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
      setPurchase(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        );

        // Only recalculate indexes if sortIndex was changed
        if (editingField.field === 'sortIndex') {
          const recalculatedItems = recalculateIndexes(
            updatedItems,
            editingField.itemId,
            parseInt(editValue)
          );
          // Update indexes in database only when sort order changes
          updateItemIndexes(recalculatedItems);
          return {
            ...prev,
            items: recalculatedItems,
          };
        } else {
          // For other fields, just update the single item
          return {
            ...prev,
            items: updatedItems,
          };
        }
      });
      cancelFieldEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <Text>Загрузка закупки...</Text>
        </div>
      </div>
    );
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
        <div className="border-b bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <div>
                <Text variant="h2" className="text-xl font-bold">
                  {purchase.name}
                </Text>
                <Text className="text-muted-foreground">
                  {purchase._count.items} товаров
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  /* TODO: Implement export */
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Файл выгрузки
              </Button>
              <Button
                onClick={createOrder}
                disabled={purchase.items.length === 0}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Создать заказ
              </Button>
            </div>
          </div>
        </div>
      </SmartHeader>

      {/* Content with spacing for fixed header on tablets/desktop */}
      <div className="pt-0 md:pt-20">
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
              <Card
                className={`relative p-4 transition-all duration-200 ${
                  isDragging ? 'opacity-20' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Left Column: Controls + Image */}
                  <div className="flex-shrink-0">
                    {/* Controls Row */}
                    <div className="mb-2 flex justify-center gap-2">
                      {/* Editable Sort Index */}
                      {editingField?.itemId === item.id &&
                      editingField?.field === 'sortIndex' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveFieldEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveFieldEdit();
                            if (e.key === 'Escape') cancelFieldEdit();
                          }}
                          className="h-8 w-auto px-2 py-1"
                          style={{
                            width: '42px',
                          }}
                          placeholder="#"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex h-8 w-[42px] cursor-pointer items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium hover:border-gray-300 hover:bg-gray-200"
                          onClick={() =>
                            startFieldEdit(item.id, 'sortIndex', item.sortIndex)
                          }
                        >
                          {item.sortIndex}
                        </div>
                      )}

                      {/* Mobile: Modal edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="h-8 w-8 p-0 md:hidden"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Product Image */}
                    <div className="flex justify-center">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                          <Text className="text-xs text-gray-500">
                            Нет фото
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="min-w-0 flex-1">
                    {/* Name and Prices Row */}
                    <div className="mb-2 flex items-center gap-4">
                      {/* Editable Name */}
                      {editingField?.itemId === item.id &&
                      editingField?.field === 'name' ? (
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveFieldEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveFieldEdit();
                            if (e.key === 'Escape') cancelFieldEdit();
                          }}
                          className="min-w-0 flex-shrink-0 px-2 py-1"
                          style={{
                            width: `${Math.max(editValue.length * 9 + 20, item.name.length * 9 + 20)}px`,
                          }}
                          placeholder="Название товара"
                          autoFocus
                        />
                      ) : (
                        <Text
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-sm font-semibold hover:border-gray-300 hover:bg-gray-100"
                          onClick={() =>
                            startFieldEdit(item.id, 'name', item.name)
                          }
                        >
                          {item.name}
                        </Text>
                      )}

                      {/* Editable Price */}
                      <div className="flex items-center gap-2">
                        {editingField?.itemId === item.id &&
                        editingField?.field === 'price' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveFieldEdit}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveFieldEdit();
                              if (e.key === 'Escape') cancelFieldEdit();
                            }}
                            className="w-24"
                            placeholder="Цена"
                            autoFocus
                          />
                        ) : (
                          <Text
                            className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-lg font-semibold hover:border-gray-300 hover:bg-gray-100"
                            onClick={() =>
                              startFieldEdit(item.id, 'price', item.price)
                            }
                          >
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(Number(item.price))}
                          </Text>
                        )}
                        <Text className="text-sm font-semibold text-red-600 line-through">
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                          }).format(Number(item.oldPrice))}
                        </Text>
                      </div>
                    </div>

                    {/* Description Row - Full Width */}
                    <div className="mb-2">
                      {editingField?.itemId === item.id &&
                      editingField?.field === 'description' ? (
                        <textarea
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveFieldEdit}
                          onKeyDown={e => {
                            if (e.key === 'Escape') cancelFieldEdit();
                          }}
                          className="min-h-[2.5rem] w-full rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          rows={2}
                          placeholder="Описание товара"
                          aria-label="Описание товара"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-muted-foreground min-h-[2.5rem] cursor-pointer rounded border border-gray-200 px-2 py-2 text-sm hover:border-gray-300 hover:bg-gray-100"
                          onClick={() =>
                            startFieldEdit(
                              item.id,
                              'description',
                              item.description
                            )
                          }
                        >
                          <div className="line-clamp-2 text-sm">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Icon */}
                  {deletingItemId === item.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2
                      className="h-4 w-4 cursor-pointer text-red-600 hover:text-red-700"
                      onClick={() => deleteItem(item.id)}
                    />
                  )}
                </div>
              </Card>
            )}
          </DraggablePurchaseItemList>
        )}
      </div>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Редактировать товар"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Название</label>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Описание</label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="w-full rounded-md border border-gray-200 p-2"
              rows={3}
              aria-label="Описание товара"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Цена</label>
              <Input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Порядок сортировки
              </label>
              <Input
                type="number"
                value={editSortIndex}
                onChange={e => setEditSortIndex(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Отмена
            </Button>
            <Button onClick={updateItem}>Сохранить</Button>
          </div>
        </div>
      </Modal>

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
