'use client';

import { useState } from 'react';
import { PlusIcon, ArrowRightIcon, StarIcon } from '@heroicons/react/24/outline';
// Custom Purchase Mode Icon - colorful pinwheel/flower design

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { CreatePurchaseModal } from '@/components/ui/CreatePurchaseModal';
import { PurchaseSelector } from '@/components/ui/PurchaseSelector';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useUser } from '@/contexts/NextAuthUserContext';

export function PurchaseModeIcon() {
  const { user } = useUser();
  const {
    isPurchaseMode,
    setIsPurchaseMode,
    activePurchase,
    setActivePurchase,
    purchases,
    refreshPurchases,
    loading,
  } = usePurchase();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Only show for admin users
  if (user?.role !== 'ADMIN') {
    return null;
  }

  const handleToggle = (checked: boolean) => {
    setIsPurchaseMode(checked);
    if (!checked) {
      setActivePurchase(null);
    }
  };

  const handlePurchaseSelect = (purchase: any) => {
    setActivePurchase(purchase);
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreatePurchase = async (name: string) => {
    try {
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create purchase');
      }

      const newPurchase = await response.json();
      setActivePurchase(newPurchase);
      await refreshPurchases();
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Compact Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        className={`relative transition-all duration-300 ${
          isPurchaseMode
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700 hover:shadow-xl'
            : '!text-white hover:bg-white/10'
        }`}
        title="Режим закупки"
      >
        {/* Use Heroicons outline Star to match header icons */}
        <StarIcon
          className={`h-6 w-6 ${isPurchaseMode ? 'animate-pulse' : ''}`}
          strokeWidth={1.5}
        />

        {/* Shine effect when active */}
        {isPurchaseMode && (
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {isPurchaseMode && activePurchase && (
          <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white shadow-md">
            {activePurchase._count.items}
          </span>
        )}
      </Button>

      {/* Modal with Purchase Controls */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Режим закупки"
        size="sm"
      >
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center gap-3">
                {/* Same star icon in modal header */}
                <StarIcon className="h-8 w-8" strokeWidth={1.5} />
                <Text className="text-lg font-semibold">Режим закупки</Text>
              </div>
              <Switch checked={isPurchaseMode} onCheckedChange={handleToggle} />
            </div>

            {/* Purchase Configuration */}
            {isPurchaseMode && (
              <div className="space-y-4">
                {/* Active Purchase Section */}
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <Text className="font-medium text-gray-900">
                    Активная закупка
                  </Text>
                  <PurchaseSelector
                    value={activePurchase?.id}
                    onChange={handlePurchaseSelect}
                    purchases={purchases}
                    placeholder="Выберите закупку"
                    loading={loading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white"
                    onClick={handleCreateNew}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Создать новую закупку
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => (window.location.href = '/admin/purchases')}
                  >
                    Перейти к закупкам
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create Purchase Modal */}
      <CreatePurchaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePurchase}
      />
    </>
  );
}
