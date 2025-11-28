'use client';

import { PurchaseToggle } from './PurchaseToggle';
import { cn } from '@/lib/utils';

interface PurchaseControlProps {
  isPurchased: boolean | null;
  onPurchaseChange: (
    isPurchased: boolean | null,
    clickedButton?: boolean
  ) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingTrue?: boolean;
  loadingFalse?: boolean;
  loadingUnset?: boolean;
  loadingUnsetFromTrue?: boolean;
  loadingUnsetFromFalse?: boolean;
  className?: string;
}

export function PurchaseControl({
  isPurchased,
  onPurchaseChange,
  disabled = false,
  loading = false,
  loadingTrue = false,
  loadingFalse = false,
  loadingUnset = false,
  loadingUnsetFromTrue = false,
  loadingUnsetFromFalse = false,
  className,
}: PurchaseControlProps) {
  // Determine if we're currently loading (any loading state)
  const isLoading = loading || loadingTrue || loadingFalse || loadingUnset || loadingUnsetFromTrue || loadingUnsetFromFalse;

  // Handle purchase change - convert to the expected format
  const handlePurchaseChange = (value: boolean | null) => {
    // The parent expects (isPurchased, clickedButton) but we only pass isPurchased
    // clickedButton is optional and not needed for toggle
    onPurchaseChange(value);
  };

  return (
    <PurchaseToggle
      isPurchased={isPurchased}
      onPurchaseChange={handlePurchaseChange}
      disabled={disabled}
      loading={isLoading}
      className={className}
    />
  );
}
