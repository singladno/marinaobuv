'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface CategoryNavigationItem {
  id: string;
  name: string;
  path: string;
  href: string;
  hasChildren?: boolean;
}

interface CategoryNavigationControlProps {
  currentCategory: string;
  categories: CategoryNavigationItem[];
  parentCategory?: {
    name: string;
    href: string;
  };
  siblingCategories?: CategoryNavigationItem[];
  parentChildren?: CategoryNavigationItem[];
  className?: string;
}

export function CategoryNavigationControl({
  currentCategory,
  categories,
  parentCategory,
  siblingCategories,
  parentChildren,
  className = '',
}: CategoryNavigationControlProps) {
  const [open, setOpen] = useState(false);
  const [showingSiblings, setShowingSiblings] = useState(false);
  const [showingParentChildren, setShowingParentChildren] = useState(false);
  const [currentViewPath, setCurrentViewPath] = useState<string>('');
  const [currentViewCategories, setCurrentViewCategories] = useState<
    CategoryNavigationItem[]
  >([]);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      // Reset to initial state when closed
      setShowingSiblings(false);
      setShowingParentChildren(false);
      setCurrentViewPath('');
      setCurrentViewCategories([]);
    }, 120);
  };

  // Filter out the current category from the list
  const availableCategories = useMemo(() => {
    // If we have a custom view (navigated within popover), use that
    if (currentViewCategories.length > 0) {
      return currentViewCategories;
    }

    if (showingSiblings && siblingCategories) {
      // When showing siblings, show sibling categories
      return siblingCategories;
    }
    if (showingParentChildren && parentChildren) {
      // When showing parent's children, show parent's children (including current category)
      return parentChildren;
    }
    // When showing subcategories, show all subcategories (including current if it's a subcategory)
    return categories;
  }, [
    categories,
    siblingCategories,
    parentChildren,
    currentCategory,
    showingSiblings,
    showingParentChildren,
    currentViewCategories,
  ]);

  // Handle navigation within the popover
  const handleCategoryClick = async (category: CategoryNavigationItem) => {
    if (category.hasChildren) {
      // Fetch subcategories for this category
      try {
        const response = await fetch(
          `/api/categories/by-path?path=${encodeURIComponent(category.path)}`
        );
        const data = await response.json();

        if (data.ok && data.subcategories) {
          setCurrentViewPath(category.path);
          setCurrentViewCategories(data.subcategories);
          setShowingSiblings(false);
          setShowingParentChildren(false);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    }
  };

  // Handle back navigation within popover
  const handleBackNavigation = () => {
    if (currentViewPath) {
      // Reset to default view
      setCurrentViewPath('');
      setCurrentViewCategories([]);
    } else if (showingParentChildren) {
      setShowingParentChildren(false);
    } else if (showingSiblings) {
      setShowingSiblings(false);
    }
  };

  if (availableCategories.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div onMouseEnter={openNow} onMouseLeave={scheduleClose}>
            <Button
              variant="outline"
              className="h-9 rounded-xl border-gray-200 bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{currentCategory}</span>
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
            {parentCategory && !showingSiblings && !showingParentChildren && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    // Navigate to parent's children (seasons)
                    if (parentChildren && parentChildren.length > 0) {
                      setShowingParentChildren(true);
                      setCurrentViewPath('');
                      setCurrentViewCategories([]);
                      setShowingSiblings(false);
                    } else {
                      setShowingSiblings(true);
                      setCurrentViewPath('');
                      setCurrentViewCategories([]);
                      setShowingParentChildren(false);
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{parentCategory.name}</span>
                </button>
              </div>
            )}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentViewPath
                  ? (() => {
                      // Generate combined name for custom view
                      // Extract gender from currentCategory and season from currentViewPath
                      const genderMatch = currentCategory.match(
                        /^(Мужская|Женская|Детская)/
                      );
                      const gender = genderMatch ? genderMatch[1] : '';

                      // Map season names
                      const seasonMap: Record<string, string> = {
                        autumn: 'осенняя',
                        winter: 'зимняя',
                        spring: 'весенняя',
                        summer: 'летняя',
                      };

                      // Extract season from currentViewPath (last segment)
                      const pathSegments = currentViewPath.split('/');
                      const seasonKey = pathSegments[pathSegments.length - 1];
                      const season = seasonMap[seasonKey] || seasonKey;

                      return `${gender} ${season} обувь`;
                    })()
                  : showingSiblings && parentCategory
                    ? parentCategory.name
                    : showingParentChildren && parentCategory
                      ? parentCategory.name
                      : currentCategory}
              </h3>
            </div>
            <div className="space-y-1">
              {availableCategories.map(category => (
                <div
                  key={category.id}
                  className="block cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  onClick={() => {
                    if (category.hasChildren) {
                      handleCategoryClick(category);
                    } else {
                      setOpen(false);
                      window.location.href = category.href;
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    {category.hasChildren && (
                      <svg
                        className="h-4 w-4 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CategoryNavigationControl;
