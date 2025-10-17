'use client';

import { useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type ViewMode = 'provider' | 'order';

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex rounded-lg bg-gray-100 p-1', className)}>
      <Button
        variant={mode === 'provider' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('provider')}
        className={cn(
          'flex flex-1 items-center space-x-2',
          mode === 'provider'
            ? 'bg-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <Package className="h-4 w-4" />
        <span className="text-sm font-medium">По поставщику</span>
      </Button>
      <Button
        variant={mode === 'order' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('order')}
        className={cn(
          'flex flex-1 items-center space-x-2',
          mode === 'order'
            ? 'bg-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="text-sm font-medium">По заказу</span>
      </Button>
    </div>
  );
}
