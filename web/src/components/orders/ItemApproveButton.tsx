'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface ItemApproveButtonProps {
  itemId: string;
  onApprovalComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'ghost' | 'success';
  unreadCount?: number;
}

export function ItemApproveButton({
  itemId,
  onApprovalComplete,
  size = 'sm',
  variant = 'primary',
  unreadCount = 0,
}: ItemApproveButtonProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    try {
      setIsApproving(true);

      // Call API to approve individual item
      const response = await fetch(`/api/order-items/${itemId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve item');
      }

      setIsApproved(true);
      onApprovalComplete?.();
    } catch (error) {
      console.error('Error approving item:', error);
      // You might want to show an error message to the user
    } finally {
      setIsApproving(false);
    }
  };

  if (isApproved) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <Text className="text-xs font-medium">Одобрено</Text>
      </div>
    );
  }

  const hasUnreadMessages = unreadCount > 0;
  const isDisabled = isApproving || hasUnreadMessages;

  return (
    <Button
      onClick={handleApprove}
      disabled={isDisabled}
      variant={
        hasUnreadMessages
          ? 'secondary'
          : variant === 'success'
            ? 'success'
            : 'primary'
      }
      size={size}
      className={hasUnreadMessages ? 'cursor-not-allowed opacity-50' : ''}
      title={hasUnreadMessages ? 'Сначала прочитайте все сообщения' : undefined}
    >
      {isApproving ? (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Одобряем...
        </>
      ) : (
        <>
          <CheckCircle className="mr-1 h-3 w-3" />
          Одобрить
        </>
      )}
    </Button>
  );
}
