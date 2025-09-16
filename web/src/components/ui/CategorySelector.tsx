import * as React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Text } from './Text';

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
        className="w-80 overflow-hidden rounded-xl border-0 bg-white p-0 shadow-xl"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search input */}
          <div className="border-b border-gray-100 p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск категории..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border-0 bg-gray-50 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Clear selection button */}
          {selectedCategory && (
            <div className="border-b border-gray-100 px-4 py-2">
              <button
                onClick={handleClear}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
              >
                ✕ Очистить выбор
              </button>
            </div>
          )}

          {/* Category tree */}
          <div className="max-h-80 overflow-auto">
            {filteredCategories.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {searchTerm
                    ? 'Категории не найдены'
                    : 'Нет доступных категорий'}
                </p>
                {searchTerm && (
                  <p className="mt-1 text-xs text-gray-400">
                    Попробуйте другой поисковый запрос
                  </p>
                )}
              </div>
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

function CategoryTree({
  categories,
  selectedId,
  onSelect,
  searchTerm,
}: {
  categories: CategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
}) {
  return (
    <div className="space-y-1">
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          selectedId={selectedId}
          onSelect={onSelect}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  selectedId,
  onSelect,
  searchTerm,
  level = 0,
}: {
  category: CategoryNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(
    searchTerm.length > 0 ||
      (category.children &&
        category.children.some(child => child.id === selectedId))
  );
  const isSelected = category.id === selectedId;
  const hasChildren = category.children && category.children.length > 0;
  const isHighlighted =
    searchTerm.length > 0 && category.name.toLowerCase().includes(searchTerm);

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelect(category.id);
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-left-1 duration-200">
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="mr-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-gray-100"
            title={isExpanded ? 'Свернуть категорию' : 'Развернуть категорию'}
            aria-label={
              isExpanded ? 'Свернуть категорию' : 'Развернуть категорию'
            }
          >
            <ChevronRightIcon
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>
        ) : (
          <div className="mr-2 h-6 w-6"></div>
        )}

        <div
          className={`group flex-1 rounded-lg transition-all duration-200 ${
            level === 0
              ? 'pl-3'
              : level === 1
                ? 'pl-6'
                : level === 2
                  ? 'pl-9'
                  : 'pl-12'
          } ${
            isSelected
              ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
              : isHighlighted
                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                : 'hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <button
            onClick={handleSelect}
            className="w-full cursor-pointer rounded-md px-1 py-2.5 text-left transition-colors duration-200 disabled:cursor-default"
            disabled={isSelected}
          >
            <div className="flex items-center">
              {isSelected && (
                <div className="mr-2 flex-shrink-0">
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-blue-500">
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <span
                className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'} ${isHighlighted ? 'text-amber-800' : ''}`}
              >
                {category.name}
              </span>
            </div>
          </button>
        </div>
      </div>
      {hasChildren && category.children && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex">
            <div className="flex w-6 justify-center">
              <div className="w-px bg-gray-200"></div>
            </div>
            <div className="flex-1 pt-1">
              <CategoryTree
                categories={category.children}
                selectedId={selectedId}
                onSelect={onSelect}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function findCategoryById(
  categories: CategoryNode[],
  id: string
): CategoryNode | null {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

function filterCategoriesBySearch(
  categories: CategoryNode[],
  searchTerm: string
): CategoryNode[] {
  return categories
    .map(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm);
      const filteredChildren = category.children
        ? filterCategoriesBySearch(category.children, searchTerm)
        : [];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren,
        };
      }
      return null;
    })
    .filter((category): category is CategoryNode => category !== null);
}
