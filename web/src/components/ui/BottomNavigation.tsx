'use client';

import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { site } from '@/lib/site';

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className = '' }: BottomNavigationProps) {
  const pathname = usePathname();

  const navigationItems: Array<{
    name: string;
    href: string;
    icon: any;
    activeIcon: any;
    isActive: boolean;
  }> = [
    {
      name: 'Главная',
      href: site.links.home,
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      isActive: pathname === site.links.home,
    },
    {
      name: 'Поиск',
      href: '/search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIconSolid,
      isActive: pathname.startsWith('/search'),
    },
    {
      name: 'Корзина',
      href: '/basket',
      icon: ShoppingBagIcon,
      activeIcon: ShoppingBagIconSolid,
      isActive: pathname === '/basket',
    },
    {
      name: 'Избранное',
      href: '/favorites',
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
      isActive: pathname === '/favorites',
    },
    {
      name: 'Профиль',
      href: '/profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
      isActive:
        pathname.startsWith('/profile') || pathname.startsWith('/orders'),
    },
  ];

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg ${className}`}
      >
        <div className="flex h-16 items-center justify-around">
          {navigationItems.map(item => {
            const Icon = item.isActive ? item.activeIcon : item.icon;

            return (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                asChild
                className="flex h-full flex-col items-center justify-center px-2 py-2 hover:bg-transparent"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center"
                >
                  <Icon
                    className={`h-6 w-6 ${
                      item.isActive ? 'text-purple-600' : 'text-gray-400'
                    }`}
                  />
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default BottomNavigation;
