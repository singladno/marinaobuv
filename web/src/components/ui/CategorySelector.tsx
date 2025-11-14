import { ChevronDownIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import {
  filterCategoriesBySearch,
  findCategoryById,
} from '@/utils/categoryUtils';

import { Button } from './Button';
import { CategorySelectorClear } from './CategorySelectorClear';
import { CategorySelectorEmpty } from './CategorySelectorEmpty';
import { CategorySelectorSearch } from './CategorySelectorSearch';
import { CategoryTree } from './CategoryTree';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  path: string;
  children?: CategoryNode[];
};

type CategorySelectorProps = {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categories: CategoryNode[];
  placeholder?: string;
  disabled?: boolean;
};

export function CategorySelector({
  value,
  onChange,
  categories,
  placeholder = 'Выберите категорию',
  disabled = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Find selected category
  const selectedCategory = React.useMemo(() => {
    if (!value) return null;
    return findCategoryById(categories, value);
  }, [value, categories]);

  // Filter categories based on search term
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm.trim()) return categories;
    return filterCategoriesBySearch(categories, searchTerm.toLowerCase());
  }, [categories, searchTerm]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full justify-between border-gray-200 bg-white text-left font-normal transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          disabled={disabled}
        >
          <span
            className={
              selectedCategory ? 'font-medium text-gray-900' : 'text-gray-500'
            }
          >
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-xl border-0 bg-white p-0 shadow-xl"
        align="start"
        sideOffset={4}
      >
        <div className="flex max-h-[400px] flex-col overflow-hidden">
          <CategorySelectorSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {selectedCategory && <CategorySelectorClear onClear={handleClear} />}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {filteredCategories.length === 0 ? (
              <CategorySelectorEmpty searchTerm={searchTerm} />
            ) : (
              <div className="animate-in fade-in-0 p-2 duration-200">
                <CategoryTree
                  categories={filteredCategories}
                  selectedId={value}
                  onSelect={handleSelect}
                  searchTerm={searchTerm}
                />
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
