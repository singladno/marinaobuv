'use client';

import * as React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory;
  isActive: boolean;
  isToggling: boolean;
  onToggle: (checked: boolean) => void;
  onDelete?: (category: FlatAdminCategory) => void;
};

export function CategoryDetailsToggle({
  category,
  isActive,
  isToggling,
  onToggle,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <Label className="block text-sm font-medium text-gray-900">
            Показывать на сайте
          </Label>
          <p className="text-xs text-gray-500">
            Черновики сохраняются, но не попадают в каталог.
          </p>
        </div>
        <div className="relative inline-flex h-6 w-11">
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            disabled={isToggling}
            className={isToggling ? 'opacity-50' : ''}
          />
          {isToggling && (
            <div
              className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center ${
                isActive ? 'right-0.5' : 'left-0.5'
              }`}
              style={{ width: '20px', height: '20px' }}
            >
              <Loader
                size="sm"
                className="[&>div]:border-gray-200 [&>div]:border-t-purple-600 dark:[&>div]:border-gray-600 dark:[&>div]:border-t-purple-400"
              />
            </div>
          )}
        </div>
      </div>
      {onDelete && (
        <div className="border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(category)}
          >
            <TrashIcon className="h-4 w-4" />
            Удалить категорию
          </Button>
        </div>
      )}
    </div>
  );
}
