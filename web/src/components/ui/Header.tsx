'use client';

import {
  HeartIcon,
  MoonIcon,
  SunIcon,
  // UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import TopRightActions from '@/components/product/TopRightActions';
import AccountMenu from '@/components/ui/AccountMenu';
import { Button } from '@/components/ui/Button';
import { SearchWithHistory } from '@/components/catalog/SearchWithHistory';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useSearch } from '@/contexts/SearchContext';
import { useUser } from '@/contexts/NextAuthUserContext';
import { site } from '@/lib/site';
import HamburgerMenu from '@/components/ui/HamburgerMenu';
import AdvancedSlidingMenu from '@/components/ui/AdvancedSlidingMenu';
import { MobileAdminSwitcher } from '@/components/ui/MobileAdminSwitcher';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const pathname = usePathname();
  const {
    searchQuery,
    searchHistory,
    handleSearch,
    clearSearchHistory,
    deleteSearchHistoryItem,
  } = useSearch();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
        // Set CSS custom property for other components to use
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`
        );
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 w-full bg-gradient-to-r from-[#ea34ea] to-violet-700 ${
          pathname === '/profile' ? 'pb-8 pt-4' : 'pb-4 pt-1'
        }`}
      >
        {/* Top Utility Bar */}
        <div className="flex items-center justify-center py-1">
          <div className="container mx-auto flex items-center justify-center px-4">
            {/* Center - Navigation Links as Buttons */}
            <nav className="hidden items-center gap-1 md:flex">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-6 px-1 text-xs font-bold !text-white hover:bg-white/10"
              >
                <Link
                  href={site.links.catalog}
                  className="text-xs font-bold !text-white"
                >
                  Каталог
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-6 px-1 text-xs font-bold !text-white hover:bg-white/10"
              >
                <Link
                  href={site.links.orders}
                  className="text-xs font-bold !text-white"
                >
                  Заказы
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-6 px-1 text-xs font-bold !text-white hover:bg-white/10"
              >
                <Link
                  href={site.links.about}
                  className="text-xs font-bold !text-white"
                >
                  О нас
                </Link>
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="container relative mx-auto flex items-center gap-4 px-4 py-0 md:px-0">
          {/* Left side - Logo - hidden on mobile/tablet */}
          <div className="hidden items-center md:flex">
            <Link href={site.links.home} className="hover:opacity-90">
              <span className="text-3xl font-bold text-white">
                {site.brand}
              </span>
            </Link>
          </div>

          {/* Hamburger Menu - Desktop only */}
          <div className="hidden md:block">
            <HamburgerMenu
              isOpen={isMenuOpen}
              onToggle={toggleMenu}
              className="rounded-xl border border-white/50 bg-transparent py-3 !text-white transition-colors duration-300 ease-in-out hover:border-white hover:bg-transparent"
            />
          </div>

          {/* Center - Search Bar or Profile Title */}
          <div className="flex flex-1 items-center justify-center">
            {pathname === '/profile' ? (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-2xl font-bold text-white">Профиль</h1>
              </div>
            ) : (
              <div className="w-full">
                <SearchWithHistory
                  value={searchQuery}
                  onChange={handleSearch}
                  searchHistory={searchHistory}
                  onClearHistory={clearSearchHistory}
                  onDeleteHistoryItem={deleteSearchHistoryItem}
                />
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Mobile Admin Switcher - only show on mobile for admin users */}
            {user?.role === 'ADMIN' && (
              <div className="md:hidden">
                <MobileAdminSwitcher />
              </div>
            )}

            {/* Theme Toggle - hidden on mobile */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="!text-white hover:bg-white/10"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5 text-white" />
                ) : (
                  <SunIcon className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>

            {/* Favorites - hidden on mobile/tablet */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="!text-white hover:bg-white/10"
              >
                <Link href="/favorites" aria-label="Избранное">
                  <HeartIcon className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Account - hidden on mobile/tablet */}
            <div className="hidden md:block">
              <AccountMenu />
            </div>

            {/* Cart - hidden on mobile/tablet */}
            <div className="hidden md:block">
              <TopRightActions />
            </div>
          </div>
        </div>
      </header>

      {/* Sliding Menu - Desktop only */}
      <div className="hidden md:block">
        <AdvancedSlidingMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </>
  );
}
