'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { site } from '@/lib/site';

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  children?: MenuItem[];
  icon?: React.ReactNode;
}

interface SlidingMenuProps {
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

export function SlidingMenu({ isOpen, onClose }: SlidingMenuProps) {
  const [currentLevel, setCurrentLevel] = useState<MenuItem[]>(catalogData);
  const [navigationStack, setNavigationStack] = useState<MenuItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Reset menu state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentLevel(catalogData);
      setNavigationStack([]);
      setHoveredItem(null);
    }
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      setNavigationStack(prev => [...prev, item]);
      setCurrentLevel(item.children);
    } else if (item.href) {
      // Navigate to the link and close menu
      window.location.href = item.href;
      onClose();
    }
  };

  const handleBackClick = () => {
    if (navigationStack.length > 0) {
      const newStack = [...navigationStack];
      const parent = newStack.pop();
      setNavigationStack(newStack);
      setCurrentLevel(parent?.children || catalogData);
    }
  };

  const handleItemHover = (itemId: string) => {
    setHoveredItem(itemId);
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
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

      {/* Menu */}
      <div
        className={`fixed left-0 top-20 z-50 h-[calc(100vh-5rem)] w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Thin white line above catalog */}
        <div className="h-px bg-white"></div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            {/* Back button */}
            {navigationStack.length > 0 && (
              <div className="mb-4 border-b pb-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {navigationStack.length > 1
                    ? navigationStack[navigationStack.length - 2]?.name
                    : catalogData.find(item =>
                        item.children?.some(
                          child => child.id === navigationStack[0]?.id
                        )
                      )?.name || 'Назад'}
                </Button>

                {/* Category header under back button for third level */}
                <div className="mt-2 px-4">
                  <Text as="h3" className="text-base font-bold text-black">
                    {navigationStack[navigationStack.length - 1]?.name}
                  </Text>
                </div>
              </div>
            )}
            <ul className="space-y-1">
              {currentLevel.map(item => (
                <li key={item.id}>
                  <div
                    className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                      hoveredItem === item.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => handleItemHover(item.id)}
                    onMouseLeave={handleItemLeave}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && (
                        <span className="text-lg">{item.icon}</span>
                      )}
                      <Text as="span" className="font-medium">
                        {item.name}
                      </Text>
                    </div>
                    {item.children && item.children.length > 0 && (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default SlidingMenu;
