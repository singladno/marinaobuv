'use client';

import { Building2, ShoppingBag, Package } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  type: 'provider' | 'order';
  itemCount: number;
  className?: string;
}

export function SectionHeader({
  title,
  type,
  itemCount,
  className,
}: SectionHeaderProps) {
  const icon = type === 'provider' ? Building2 : ShoppingBag;
  const Icon = icon;

  return (
    <div
      className={cn(
        'relative mb-4 rounded-lg border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm',
        className
      )}
    >
      {/* Decorative top border */}
      <div className="absolute -top-1 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">
              {type === 'provider' ? 'Поставщик' : 'Заказ'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="secondary"
            className="flex items-center whitespace-nowrap border-blue-200 bg-blue-100 text-blue-700"
          >
            <Package className="mr-1 h-3 w-3 flex-shrink-0" />
            <span className="flex items-center">{itemCount} товаров</span>
          </Badge>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="mt-3 h-0.5 w-full rounded-full bg-gradient-to-r from-blue-200 to-transparent"></div>
    </div>
  );
}
