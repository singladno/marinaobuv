'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
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

// Mock catalog data - in real app this would come from API
const catalogData: MenuItem[] = [
  {
    id: 'obuv',
    name: 'Обувь',
    icon: '👟',
    children: [
      {
        id: 'women-shoes',
        name: 'Женская обувь',
        children: [
          {
            id: 'women-boots',
            name: 'Ботинки',
            href: '/catalog?category=women-boots',
          },
          {
            id: 'women-sneakers',
            name: 'Кроссовки',
            href: '/catalog?category=women-sneakers',
          },
          {
            id: 'women-heels',
            name: 'Туфли',
            href: '/catalog?category=women-heels',
          },
          {
            id: 'women-sandals',
            name: 'Сандалии',
            href: '/catalog?category=women-sandals',
          },
          {
            id: 'women-slippers',
            name: 'Тапочки',
            href: '/catalog?category=women-slippers',
          },
        ],
      },
      {
        id: 'men-shoes',
        name: 'Мужская обувь',
        children: [
          {
            id: 'men-boots',
            name: 'Ботинки',
            href: '/catalog?category=men-boots',
          },
          {
            id: 'men-sneakers',
            name: 'Кроссовки',
            href: '/catalog?category=men-sneakers',
          },
          {
            id: 'men-shoes',
            name: 'Туфли',
            href: '/catalog?category=men-shoes',
          },
          {
            id: 'men-sandals',
            name: 'Сандалии',
            href: '/catalog?category=men-sandals',
          },
          {
            id: 'men-slippers',
            name: 'Тапочки',
            href: '/catalog?category=men-slippers',
          },
        ],
      },
      {
        id: 'kids-shoes',
        name: 'Детская обувь',
        children: [
          {
            id: 'kids-boots',
            name: 'Ботинки',
            href: '/catalog?category=kids-boots',
          },
          {
            id: 'kids-sneakers',
            name: 'Кроссовки',
            href: '/catalog?category=kids-sneakers',
          },
          {
            id: 'kids-sandals',
            name: 'Сандалии',
            href: '/catalog?category=kids-sandals',
          },
          {
            id: 'kids-slippers',
            name: 'Тапочки',
            href: '/catalog?category=kids-slippers',
          },
        ],
      },
    ],
  },
  {
    id: 'accessories',
    name: 'Аксессуары',
    icon: '👜',
    children: [
      { id: 'bags', name: 'Сумки', href: '/catalog?category=bags' },
      { id: 'belts', name: 'Ремни', href: '/catalog?category=belts' },
      { id: 'wallets', name: 'Кошельки', href: '/catalog?category=wallets' },
      { id: 'hats', name: 'Головные уборы', href: '/catalog?category=hats' },
    ],
  },
  {
    id: 'clothing',
    name: 'Одежда',
    icon: '👕',
    children: [
      {
        id: 'women-clothing',
        name: 'Женская одежда',
        href: '/catalog?category=women-clothing',
      },
      {
        id: 'men-clothing',
        name: 'Мужская одежда',
        href: '/catalog?category=men-clothing',
      },
      {
        id: 'kids-clothing',
        name: 'Детская одежда',
        href: '/catalog?category=kids-clothing',
      },
    ],
  },
];

export function AdvancedSlidingMenu({
  isOpen,
  onClose,
}: AdvancedSlidingMenuProps) {
  const [currentLevel, setCurrentLevel] = useState<MenuItem[]>(catalogData);
  const [navigationStack, setNavigationStack] = useState<MenuItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Reset menu state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentLevel(catalogData);
      setNavigationStack([]);
      setHoveredItem(null);
      setShowSubMenu(false);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  }, [isOpen, hoverTimeout]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // If we're in the sub-menu (second level), navigate to third level
      if (showSubMenu && hoveredItem) {
        setNavigationStack(prev => [...prev, item]);
        setCurrentLevel(item.children);
        setHoveredItem(null);
        // Keep sub-menu open when navigating to third level
        setShowSubMenu(true);
      } else {
        // If we're in the main menu (first level), just show sub-menu on hover
        // Don't navigate, just show sub-menu
      }
    } else if (item.href) {
      // Navigate to the link and close menu
      window.location.href = item.href;
      onClose();
    }
  };

  const handleBackClick = () => {
    console.log('Back button clicked - Current state:', {
      navigationStackLength: navigationStack.length,
      showSubMenu,
      hoveredItem: hoveredItem?.name,
    });

    if (navigationStack.length > 0) {
      const newStack = [...navigationStack];
      const parent = newStack.pop();
      setNavigationStack(newStack);
      setCurrentLevel(parent?.children || catalogData);

      // Set hoveredItem to the parent category to show its subcategories
      if (newStack.length > 0) {
        // If we're going back to a subcategory level, find the parent in the main catalog
        const grandParent = catalogData.find(item =>
          item.children?.some(
            child => child.id === newStack[newStack.length - 1]?.id
          )
        );
        setHoveredItem(grandParent || null);
      } else {
        // If we're going back to the main level, find the parent category
        const parentCategory = catalogData.find(item =>
          item.children?.some(child => child.id === parent?.id)
        );
        setHoveredItem(parentCategory || null);
      }

      // Don't close the sub-menu, keep it open to show the previous category
      setShowSubMenu(true);

      console.log('After back click - New state:', {
        newNavigationStackLength: newStack.length,
        showSubMenu: true,
        parentName: parent?.name,
        hoveredItem:
          newStack.length > 0
            ? catalogData.find(item =>
                item.children?.some(
                  child => child.id === newStack[newStack.length - 1]?.id
                )
              )?.name
            : catalogData.find(item =>
                item.children?.some(child => child.id === parent?.id)
              )?.name,
      });
    } else {
      // If no navigation stack, go back to showing sub-menu
      setShowSubMenu(true);
      setHoveredItem(
        catalogData.find(item =>
          item.children?.some(child => child.children?.length > 0)
        )
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
        setCurrentLevel(catalogData);
      }

      setHoveredItem(item);
      setShowSubMenu(true);
    }
  };

  const handleItemLeave = () => {
    // Set a longer timeout to make it easier to move to sub-menu
    const timeout = setTimeout(() => {
      setHoveredItem(null);
      // Don't close sub-menu if we're in navigation mode
      if (navigationStack.length === 0) {
        setShowSubMenu(false);
      }
    }, 300);
    setHoverTimeout(timeout);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed bottom-0 left-0 right-0 top-20 z-40 bg-black/20 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Menu Container */}
      <div
        className="fixed left-0 top-20 z-50 flex h-[calc(100vh-5rem)]"
        onMouseLeave={() => {
          // Only hide if we're not in navigation mode
          if (navigationStack.length === 0) {
            handleItemLeave();
          }
        }}
      >
        {/* Main Menu */}
        <div
          className={`w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Menu items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              <ul className="space-y-0">
                {catalogData.map(item => (
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
                          <span className="text-base">{item.icon}</span>
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
        {(() => {
          const shouldShow = showSubMenu || navigationStack.length > 0;
          console.log('Sub-menu visibility check:', {
            showSubMenu,
            navigationStackLength: navigationStack.length,
            shouldShow,
          });
          return shouldShow;
        })() ? (
          <div
            className="animate-in slide-in-from-left w-64 transform border-l bg-white shadow-xl transition-transform duration-200 ease-in-out"
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
                {/* Back button for third level */}
                {navigationStack.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={handleBackClick}
                      className="flex items-center gap-2 text-base font-semibold text-gray-500 transition-colors duration-300 hover:text-black"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      {navigationStack.length > 1
                        ? navigationStack[navigationStack.length - 2]?.name
                        : catalogData.find(item =>
                            item.children?.some(
                              child => child.id === navigationStack[0]?.id
                            )
                          )?.name || 'Назад'}
                    </button>

                    {/* Category header under back button for third level */}
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
                    <Text
                      as="h3"
                      className="text-base font-semibold text-black"
                    >
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
        ) : null}
      </div>
    </>
  );
}

export default AdvancedSlidingMenu;
