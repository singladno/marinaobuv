'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { FaShoePrints } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  children?: MenuItem[];
  icon?: React.ReactNode;
}

interface AdvancedSlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
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

// Fetch categories from API (only those with products are returned by /api/categories/tree)
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
      href: `/catalog/${n.path.replace(/^obuv\//, '')}`,
      children: (n.children || []).map((child: any) => mapNode(child, false)),
      icon: isFirstLevel ? getCategoryIcon(n.name) : undefined,
    });
    return items.map(item => mapNode(item, true));
  } catch (e) {
    console.error('Failed to fetch catalogData', e);
    return [];
  }
}

export function AdvancedSlidingMenu({
  isOpen,
  onClose,
}: AdvancedSlidingMenuProps) {
  const [root, setRoot] = useState<MenuItem[]>([]);
  const [currentLevel, setCurrentLevel] = useState<MenuItem[]>([]);
  const [navigationStack, setNavigationStack] = useState<MenuItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCatalogData().then(items => {
      setRoot(items);
      setCurrentLevel(items);
    });
  }, []);

  // Reset menu state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentLevel(root);
      setNavigationStack([]);
      setHoveredItem(null);
      setShowSubMenu(false);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  }, [isOpen, hoverTimeout, root]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // Always navigate deeper when clicking on items with children
      setNavigationStack(prev => [...prev, item]);
      setCurrentLevel(item.children);
      setHoveredItem(null);
      setShowSubMenu(true);
    } else if (item.href) {
      // Navigate to the link and close menu
      window.location.href = item.href;
      onClose();
    }
  };

  const handleBackClick = () => {
    if (navigationStack.length > 0) {
      const newStack = [...navigationStack];
      const currentItem = newStack.pop();
      setNavigationStack(newStack);

      if (newStack.length > 0) {
        // Going back to a previous level - show its children
        const parentItem = newStack[newStack.length - 1];
        setCurrentLevel(parentItem.children || []);
      } else {
        // Going back to the main level - find the parent category and show its children
        const parentCategory = root.find(item =>
          item.children?.some(child => child.id === currentItem?.id)
        );
        if (parentCategory) {
          setHoveredItem(parentCategory);
          setCurrentLevel(parentCategory.children || []);
        }
      }

      setShowSubMenu(true);
    } else {
      // If no navigation stack, go back to showing sub-menu
      setShowSubMenu(true);
      setHoveredItem(
        root.find(item =>
          item.children?.some(child => (child.children?.length ?? 0) > 0)
        ) || null
      );
    }
  };

  const handleItemHover = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }

      // If we're in navigation mode (third level), reset to show new subcategory
      if (navigationStack.length > 0) {
        setNavigationStack([]);
        setCurrentLevel(root);
      }

      setHoveredItem(item);
      setShowSubMenu(true);
    }
  };

  const handleItemLeave = () => {
    // Set a timeout to make it easier to move to sub-menu
    const timeout = setTimeout(() => {
      setHoveredItem(null);
      // Don't close sub-menu if we're in navigation mode
      if (navigationStack.length === 0) {
        setShowSubMenu(false);
      }
    }, 150);
    setHoverTimeout(timeout);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-black/20 transition-opacity duration-200 ease-out ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ top: 'var(--header-height, 82px)' }}
        onClick={onClose}
      />

      {/* Menu Container */}
      <div
        className={`duration-250 fixed left-0 z-50 flex transition-transform ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          top: 'var(--header-height, 82px)',
          height: 'calc(100vh - var(--header-height, 82px))',
        }}
        onMouseLeave={() => {
          // Only hide if we're not in navigation mode
          if (navigationStack.length === 0) {
            handleItemLeave();
          }
        }}
      >
        {/* Main Menu */}
        <div className="w-64 bg-white shadow-xl">
          {/* Menu items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              <ul className="space-y-0">
                {root.map(item => (
                  <li key={item.id}>
                    <div
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-4 py-1.5 transition-colors ${
                        hoveredItem?.id === item.id
                          ? 'bg-gray-100'
                          : 'hover:bg-gray-100'
                      }`}
                      onMouseEnter={() => handleItemHover(item)}
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
                        <ChevronRightIcon
                          className={`h-4 w-4 text-gray-500 transition-opacity ${
                            hoveredItem?.id === item.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Sub Menu (appears on hover or when navigating) */}
        <div
          className={`w-64 border-l bg-white shadow-xl transition-all duration-150 ease-out ${
            showSubMenu || navigationStack.length > 0
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-full opacity-0'
          }`}
          onMouseEnter={() => {
            // Clear timeout and keep sub-menu visible when hovering over it
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
            if (navigationStack.length === 0) {
              setShowSubMenu(true);
            }
          }}
        >
          {/* Sub Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              {/* Back button for any level beyond first */}
              {navigationStack.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-base font-semibold text-gray-500 transition-colors duration-300 hover:text-black"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    {navigationStack.length > 1
                      ? navigationStack[navigationStack.length - 2]?.name
                      : hoveredItem?.name || 'Назад'}
                  </button>

                  {/* Category header under back button */}
                  <div className="mt-2 px-4">
                    <Text as="h3" className="text-base font-bold text-black">
                      {navigationStack[navigationStack.length - 1]?.name}
                    </Text>
                  </div>
                </div>
              )}
              {/* Sub-menu header - just the category name */}
              {!navigationStack.length && hoveredItem && (
                <div className="px-4 py-1.5 transition-colors duration-300 hover:text-gray-600">
                  <Text as="h3" className="text-base font-semibold text-black">
                    {hoveredItem.name}
                  </Text>
                </div>
              )}
              <ul className="space-y-0">
                {(navigationStack.length > 0
                  ? currentLevel
                  : hoveredItem?.children || []
                ).map(subItem => (
                  <li key={subItem.id}>
                    <div
                      className="group flex cursor-pointer items-center justify-between rounded-lg px-4 py-1.5 transition-colors hover:bg-gray-100"
                      onClick={() => handleItemClick(subItem)}
                    >
                      <div className="flex items-center gap-3">
                        <Text as="span" className="text-sm">
                          {subItem.name}
                        </Text>
                      </div>
                      {subItem.children && subItem.children.length > 0 && (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdvancedSlidingMenu;
