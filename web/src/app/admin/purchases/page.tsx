'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ShoppingCart, Calendar, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { usePurchase } from '@/contexts/PurchaseContext';

interface Purchase {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    product: {
      id: string;
      images: Array<{ url: string; isPrimary: boolean }>;
    };
  }>;
  _count: {
    items: number;
  };
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPurchaseName, setNewPurchaseName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(
    null
  );

  const confirmationModal = useConfirmationModal();
  const { addNotification } = useNotifications();
  const { refreshPurchases, activePurchase, setActivePurchase } = usePurchase();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/purchases');
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createPurchase = async () => {
    if (!newPurchaseName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPurchaseName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create purchase');
      }

      const newPurchase = await response.json();
      setPurchases(prev => [newPurchase, ...prev]);
      setNewPurchaseName('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create purchase'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const deletePurchase = async (id: string) => {
    const confirmed = await confirmationModal.showConfirmation({
      title: 'Подтверждение удаления',
      message:
        'Вы уверены, что хотите удалить эту закупку? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setDeletingPurchaseId(id);

      const response = await fetch(`/api/admin/purchases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete purchase');
      }

      setPurchases(prev => prev.filter(p => p.id !== id));
      // Refresh the PurchaseContext to sync the deletion
      await refreshPurchases();
      // Clear active purchase if the deleted purchase was active
      if (activePurchase?.id === id) {
        setActivePurchase(null);
      }
      addNotification({
        type: 'success',
        title: 'Закупка удалена',
        message: 'Закупка успешно удалена',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Ошибка при удалении',
        message:
          err instanceof Error ? err.message : 'Failed to delete purchase',
      });
    } finally {
      setDeletingPurchaseId(null);
      confirmationModal.setLoading(false);
      confirmationModal.closeModal();
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <Text>Загрузка закупок...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <Text className="mb-4 text-red-600">{error}</Text>
        <Button onClick={fetchPurchases}>Попробовать снова</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h1" className="text-2xl font-bold">
            Закупки
          </Text>
          <Text className="text-muted-foreground">
            Управление закупками товаров
          </Text>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Создать закупку
        </Button>
      </div>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <Text variant="h3" className="mb-2">
            Нет закупок
          </Text>
          <Text className="text-muted-foreground mb-4">
            Создайте первую закупку, чтобы начать работу
          </Text>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Создать закупку
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {purchases.map(purchase => (
            <Card
              key={purchase.id}
              className="flex flex-col p-6 transition-shadow hover:shadow-lg"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <Text variant="h3" className="mb-2 font-semibold">
                    {purchase.name}
                  </Text>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(purchase.createdAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePurchase(purchase.id)}
                  disabled={deletingPurchaseId === purchase.id}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingPurchaseId === purchase.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Content - grows to fill available space */}
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text className="text-muted-foreground text-sm">
                      Товаров в закупке:
                    </Text>
                    <Badge variant="secondary">{purchase._count.items}</Badge>
                  </div>

                  {/* Product thumbnails - fixed height container */}
                  <div className="min-h-[40px]">
                    {purchase.items.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {purchase.items.slice(0, 8).map(item => (
                          <div key={item.id} className="relative">
                            {item.product.images[0] ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.name}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-md border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-gray-200">
                                <Text className="text-xs text-gray-400">?</Text>
                              </div>
                            )}
                          </div>
                        ))}
                        {purchase.items.length > 8 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-100">
                            <Text className="text-muted-foreground text-xs font-medium">
                              +{purchase.items.length - 8}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - always at bottom */}
              <div className="mt-4 border-t pt-4">
                <Link href={`/admin/purchases/${purchase.id}`}>
                  <Button className="w-full">Открыть закупку</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Purchase Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать закупку"
        size="sm"
      >
        <div className="px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Text
                variant="body"
                className="font-medium text-gray-900 dark:text-white"
              >
                Название закупки
              </Text>
              <Input
                value={newPurchaseName}
                onChange={e => setNewPurchaseName(e.target.value)}
                placeholder="Введите название закупки..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    createPurchase();
                  }
                }}
                fullWidth
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={createPurchase}
                disabled={!newPurchaseName.trim() || isCreating}
              >
                {isCreating ? 'Создание...' : 'Создать'}
              </Button>
            </div>
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
