'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useOrderData } from '@/hooks/useOrderData';

interface OrderItem {
  id: string;
  isAvailable?: boolean | null;
}

interface OrderApprovalButtonProps {
  orderId: string;
  items?: OrderItem[];
  approvedItems?: Set<string>;
  onApprovalComplete?: () => void;
}

export function OrderApprovalButton({
  orderId,
  items = [],
  approvedItems = new Set(),
  onApprovalComplete,
}: OrderApprovalButtonProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showUnapprovedWarning, setShowUnapprovedWarning] = useState(false);
  const { data, hasMessages, needsApproval, allItemsApproved } =
    useOrderData(orderId);

  // Check if all required items are approved
  const checkAllItemsApproved = () => {
    const requiredItems = items.filter(item =>
      needsApproval(item.id, item.isAvailable)
    );

    const unapprovedItems = requiredItems.filter(
      item => !approvedItems.has(item.id)
    );

    return {
      allApproved: unapprovedItems.length === 0,
      unapprovedCount: unapprovedItems.length,
      totalRequired: requiredItems.length,
    };
  };

  const handleApprove = async () => {
    const { allApproved, unapprovedCount } = checkAllItemsApproved();

    if (!allApproved) {
      setShowUnapprovedWarning(true);
      setTimeout(() => setShowUnapprovedWarning(false), 3000);
      return;
    }

    try {
      setIsApproving(true);

      // Call API to move order to next status
      const response = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve order');
      }

      setIsApproved(true);
      onApprovalComplete?.();
    } catch (error) {
      console.error('Error approving order:', error);
      // You might want to show an error message to the user
    } finally {
      setIsApproving(false);
    }
  };

  if (isApproved) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <Text className="font-medium">Заказ одобрен</Text>
      </div>
    );
  }

  const { allApproved, unapprovedCount, totalRequired } =
    checkAllItemsApproved();

  // If no items require approval, show ready message
  if (totalRequired === 0) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <Text className="font-medium">Все товары готовы</Text>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showUnapprovedWarning && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <Text className="text-sm font-medium">
            Сначала одобрите {unapprovedCount} товар
            {unapprovedCount === 1 ? '' : unapprovedCount < 5 ? 'а' : 'ов'}{' '}
            индивидуально
          </Text>
        </div>
      )}

      <Button
        onClick={handleApprove}
        disabled={isApproving || !allApproved}
        className={`${
          allApproved
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'cursor-not-allowed bg-gray-400 text-white'
        }`}
      >
        {isApproving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Одобряем...
          </>
        ) : allApproved ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Одобрить заказ
          </>
        ) : (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Сначала одобрите товары
          </>
        )}
      </Button>
    </div>
  );
}
