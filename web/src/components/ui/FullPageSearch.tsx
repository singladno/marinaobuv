'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { FaShoePrints } from 'react-icons/fa';
import {
  SparklesIcon,
  UserGroupIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useSearch } from '@/contexts/SearchContext';
import { Text } from '@/components/ui/Text';

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  children?: MenuItem[];
  icon?: React.ReactNode;
}

// Function to get appropriate icon for category
const getCategoryIcon = (categoryName: string): React.ReactNode => {
  const name = categoryName.toLowerCase();

  if (name.includes('обувь') || name.includes('обув')) {
    return <FaShoePrints className="h-5 w-5" />;
  }
  if (
    name.includes('аксессуар') ||
    name.includes('сумк') ||
    name.includes('ремн')
  ) {
    return <SparklesIcon className="h-5 w-5" />;
  }
  if (
    name.includes('одежд') ||
    name.includes('плать') ||
    name.includes('рубашк')
  ) {
    return <UserGroupIcon className="h-5 w-5" />;
  }

  // Default icon for unknown categories
  return <ShoppingBagIcon className="h-5 w-5" />;
};

// Fetch categories from API (same as hamburger menu)
async function fetchCatalogData(): Promise<MenuItem[]> {
  try {
    const res = await fetch('/api/categories/tree', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data?.items ?? []) as Array<{
      id: string;
      name: string;
      path: string;
      children: any[];
    }>;
    const mapNode = (n: any, isFirstLevel: boolean = false): MenuItem => ({
      id: n.id,
      name: n.name,
      href: `/catalog/${n.path}`, // Use full database path - single source of truth
      children: (n.children || []).map((child: any) => mapNode(child, false)),
      icon: isFirstLevel ? getCategoryIcon(n.name) : undefined,
    });
    return items.map(item => mapNode(item, true));
  } catch (e) {
    console.error('Failed to fetch catalogData', e);
    return [];
  }
}

export function FullPageSearch() {
  const {
    searchQuery,
    searchHistory,
    handleSearch,
    clearSearchHistory,
    deleteSearchHistoryItem,
  } = useSearch();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [catalogItems, setCatalogItems] = useState<MenuItem[]>([]);
  const [currentLevel, setCurrentLevel] = useState<MenuItem[]>([]);
  const [navigationStack, setNavigationStack] = useState<MenuItem[]>([]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchCatalogData().then(items => {
      setCatalogItems(items);
      setCurrentLevel(items);
    });
  }, []);

  const handleLocalSearch = (query: string) => {
    setLocalQuery(query);
    handleSearch(query);
  };

  const handleCategoryClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // Navigate to subcategory
      setNavigationStack(prev => [...prev, item]);
      setCurrentLevel(item.children);
    } else if (item.href) {
      // Navigate to catalog page
      window.location.href = item.href;
    }
  };

  const handleBackClick = () => {
    if (navigationStack.length > 0) {
      const newStack = [...navigationStack];
      const currentItem = newStack.pop();
      setNavigationStack(newStack);

      if (newStack.length > 0) {
        // Going back to a previous level
        const parentItem = newStack[newStack.length - 1];
        setCurrentLevel(parentItem.children || []);
      } else {
        // Going back to root level
        setCurrentLevel(catalogItems);
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Search Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {localQuery ? (
          <div className="space-y-4">
            <p className="text-gray-500">
              Поиск товаров по запросу &ldquo;{localQuery}&rdquo;...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button - only show if we're in a subcategory */}
            {navigationStack.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleBackClick}
                  className="flex cursor-pointer items-center gap-2 text-base font-semibold text-gray-500 transition-colors duration-300 hover:text-black"
                >
                  <ArrowLeftIcon className="h-4 w-4 transition-colors duration-300 hover:text-purple-600" />
                  {navigationStack[navigationStack.length - 1]?.name}
                </button>
              </div>
            )}

            {/* Catalog Menu Items */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                {navigationStack.length > 0
                  ? navigationStack[navigationStack.length - 1]?.name
                  : 'Каталог'}
              </h3>
              <div className="space-y-1">
                {currentLevel.map(item => (
                  <div key={item.id}>
                    <button
                      onClick={() => handleCategoryClick(item)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <div className="flex items-center justify-center text-gray-600">
                            {item.icon}
                          </div>
                        )}
                        <Text as="span" className="text-sm">
                          {item.name}
                        </Text>
                      </div>
                      {item.children && item.children.length > 0 && (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FullPageSearch;
