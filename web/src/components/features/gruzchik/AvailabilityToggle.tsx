'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onAvailabilityChange: (isAvailable: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AvailabilityToggle({
  isAvailable,
  onAvailabilityChange,
  disabled = false,
  loading = false,
  className,
}: AvailabilityToggleProps) {
  const handleToggle = async (checked: boolean) => {
    if (disabled || loading) return;
    await onAvailabilityChange(checked);
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div className="flex items-center space-x-2">
        <Switch
          checked={isAvailable}
          onCheckedChange={handleToggle}
          disabled={disabled || loading}
          className="data-[state=checked]:bg-green-600"
        />
        <span className="text-sm font-medium text-gray-700">
          {isAvailable ? 'В наличии' : 'Нет в наличии'}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        {isAvailable ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}
