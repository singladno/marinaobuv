'use client';

import {
  HeartIcon,
  MoonIcon,
  SunIcon,
  // UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import TopRightActions from '@/components/product/TopRightActions';
import AccountMenu from '@/components/ui/AccountMenu';
import { Button } from '@/components/ui/Button';
import MobileMenu from '@/components/ui/MobileMenu';
import { SearchWithHistory } from '@/components/catalog/SearchWithHistory';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useSearch } from '@/contexts/SearchContext';
import { site } from '@/lib/site';
import HamburgerMenu from '@/components/ui/HamburgerMenu';
import AdvancedSlidingMenu from '@/components/ui/AdvancedSlidingMenu';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
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

  const handleMenuClick = (item: string) => {
    console.log(`Navigation clicked: ${item}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#ea34ea] to-violet-700 pb-4 pt-1"
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
        <div className="container mx-auto flex items-center gap-4 py-0">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href={site.links.home} className="hover:opacity-90">
              <span className="text-3xl font-bold text-white">
                {site.brand}
              </span>
            </Link>
          </div>

          {/* Hamburger Menu - Between logo and search */}
          <HamburgerMenu
            isOpen={isMenuOpen}
            onToggle={toggleMenu}
            className="rounded-xl border border-white/50 bg-transparent py-3 !text-white transition-colors duration-300 ease-in-out hover:border-white hover:bg-transparent"
          />

          {/* Center - Search Bar */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full">
              <SearchWithHistory
                value={searchQuery}
                onChange={handleSearch}
                searchHistory={searchHistory}
                onClearHistory={clearSearchHistory}
                onDeleteHistoryItem={deleteSearchHistoryItem}
              />
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
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

            {/* Favorites */}
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

            {/* Account */}
            <AccountMenu />

            {/* Cart */}
            <TopRightActions />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Sliding Menu */}
      <AdvancedSlidingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
