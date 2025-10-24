'use client';

import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Suspense } from 'react';
import { site } from '@/lib/site';

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className = '' }: BottomNavigationProps) {
  const pathname = usePathname();
  const { totalQty } = useCart();
  const { user } = useUser();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousQty, setPreviousQty] = useState(totalQty);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Trigger bounce animation when cart quantity increases
  useEffect(() => {
    if (totalQty > previousQty) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousQty(totalQty);
  }, [totalQty, previousQty]);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const navigationItems: Array<{
    name: string;
    href: string;
    icon: any;
    activeIcon: any;
    isActive: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }> = [
    {
      name: 'Главная',
      href: site.links.home,
      icon: HomeIconSolid,
      activeIcon: HomeIconSolid,
      isActive: pathname === site.links.home,
    },
    {
      name: 'Поиск',
      href: '/search',
      icon: MagnifyingGlassIconSolid,
      activeIcon: MagnifyingGlassIconSolid,
      isActive: pathname.startsWith('/search'),
    },
    {
      name: 'Корзина',
      href: '/basket',
      icon: ShoppingCartIconSolid,
      activeIcon: ShoppingCartIconSolid,
      isActive: pathname === '/basket',
    },
    {
      name: 'Избранное',
      href: '/favorites',
      icon: HeartIconSolid,
      activeIcon: HeartIconSolid,
      isActive: pathname === '/favorites',
    },
    {
      name: 'Профиль',
      href: user ? '/profile' : '#',
      icon: UserIconSolid,
      activeIcon: UserIconSolid,
      isActive:
        pathname.startsWith('/profile') || pathname.startsWith('/orders'),
      onClick: user ? undefined : handleProfileClick,
    },
  ];

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ bottom: '-1px' }}
      >
        <nav className={`bg-white shadow-2xl ${className}`}>
          <div className="flex h-16 items-center justify-around">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isBasket = item.name === 'Корзина';
              const isProfile = item.name === 'Профиль';

              if (isProfile && item.onClick) {
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    onClick={item.onClick}
                    className="flex h-full flex-col items-center justify-center px-2 py-2 hover:bg-transparent"
                  >
                    <div className="relative">
                      <Icon
                        className={`h-6 w-6 ${
                          item.isActive ? 'text-purple-600' : 'text-gray-300'
                        } transition-transform duration-300`}
                      />
                    </div>
                  </Button>
                );
              }

              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  asChild={!item.onClick}
                  onClick={item.onClick}
                  className="flex h-full flex-col items-center justify-center px-2 py-2 hover:bg-transparent"
                >
                  {item.onClick ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <Icon
                          className={`h-6 w-6 ${
                            item.isActive ? 'text-purple-600' : 'text-gray-300'
                          } ${
                            isBasket && isAnimating ? 'scale-110' : 'scale-100'
                          } transition-transform duration-300`}
                        />
                        {isBasket && totalQty > 0 && (
                          <span
                            className={`absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-semibold text-white transition-all duration-300 ${
                              isAnimating
                                ? 'scale-125 bg-green-500'
                                : 'scale-100'
                            }`}
                          >
                            {totalQty}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex flex-col items-center justify-center"
                    >
                      <div className="relative">
                        <Icon
                          className={`h-6 w-6 ${
                            item.isActive ? 'text-purple-600' : 'text-gray-300'
                          } ${
                            isBasket && isAnimating ? 'scale-110' : 'scale-100'
                          } transition-transform duration-300`}
                        />
                        {isBasket && totalQty > 0 && (
                          <span
                            className={`absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-semibold text-white transition-all duration-300 ${
                              isAnimating
                                ? 'scale-125 bg-green-500'
                                : 'scale-100'
                            }`}
                          >
                            {totalQty}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>
      </div>

      <Suspense fallback={null}>
        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </Suspense>
    </>
  );
}

export default BottomNavigation;
