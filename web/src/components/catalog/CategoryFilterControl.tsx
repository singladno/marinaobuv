'use client';

import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface CategoryFilterItem {
  id: string;
  name: string;
  productCount?: number;
}

interface CategoryFilterControlProps {
  selectedCategories: string[];
  categories: CategoryFilterItem[];
  onSelectionChange: (categoryIds: string[]) => void;
  onClear: () => void;
  className?: string;
}

export function CategoryFilterControl({
  selectedCategories,
  categories,
  onSelectionChange,
  onClear,
  className = '',
}: CategoryFilterControlProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setSearchQuery(''); // Reset search when closing
    }, 120);
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(cat => cat.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const hasSelection = selectedCategories.length > 0;

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const handleClear = () => {
    onClear();
    setSearchQuery('');
  };

  const handleDone = () => {
    setOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div onMouseEnter={openNow} onMouseLeave={scheduleClose}>
            <Button
              variant="outline"
              className={`h-9 rounded-xl border-gray-200 shadow-sm hover:bg-gray-100 ${
                hasSelection
                  ? 'border-purple-300 bg-purple-100 text-purple-700'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                {hasSelection ? (
                  <>
                    <span>Категория</span>
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-sm hover:bg-purple-200/60"
                      aria-label="Очистить"
                    >
                      ×
                    </span>
                  </>
                ) : (
                  <span>Категория</span>
                )}
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    open ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="min-w-80 max-w-96 rounded-xl border border-gray-200 p-0 shadow-lg"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <div className="p-3">
            {/* Search input */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Найти в списке"
              className="h-11 w-full rounded-xl border-0 bg-gray-100 px-4 text-sm outline-none ring-0 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-300"
            />

            {/* Category list */}
            <div className="scrollbar-thin max-h-80 overflow-y-auto">
              <div className="space-y-1 py-3">
                {filteredCategories.map(category => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <label
                      key={category.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg py-2 hover:bg-gray-50"
                      onClick={e => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <span
                        className={`text-sm ${
                          isSelected
                            ? 'font-medium text-purple-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {category.name}
                      </span>
                      {category.productCount !== undefined && (
                        <span className="ml-auto text-xs text-gray-500">
                          {category.productCount}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Сбросить
              </Button>
              <Button
                onClick={handleDone}
                className="flex-1 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              >
                Готово
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CategoryFilterControl;
