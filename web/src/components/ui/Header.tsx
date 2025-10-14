'use client';

import {
  HeartIcon,
  MoonIcon,
  SunIcon,
  // UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

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

  const handleMenuClick = (item: string) => {
    console.log(`Navigation clicked: ${item}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-pink-500 to-purple-700">
        <div className="container mx-auto flex h-20 items-center gap-4 px-4">
          {/* Hamburger Menu */}
          <HamburgerMenu
            isOpen={isMenuOpen}
            onToggle={toggleMenu}
            className="!text-white hover:bg-white/10"
          />

          {/* Logo - Made bigger */}
          <div className="flex items-center gap-2">
            <Link href={site.links.home} className="hover:opacity-90">
              <Text as="span" className="text-2xl font-bold" tone="inverted">
                {site.brand}
              </Text>
            </Link>
          </div>

          {/* Desktop Navigation - Above search bar */}
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Button
              variant="ghost"
              onClick={() => handleMenuClick('catalog')}
              asChild
              className="!text-white hover:bg-white/10"
            >
              <Link href={site.links.catalog} className="!text-white">
                Каталог
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleMenuClick('orders')}
              asChild
              className="!text-white hover:bg-white/10"
            >
              <Link href={site.links.orders} className="!text-white">
                Заказы
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleMenuClick('about')}
              asChild
              className="!text-white hover:bg-white/10"
            >
              <Link href={site.links.about} className="!text-white">
                О нас
              </Link>
            </Button>
          </nav>

          {/* Search Bar - Takes all available space */}
          <div className="flex flex-1 items-center">
            <SearchWithHistory
              value={searchQuery}
              onChange={handleSearch}
              searchHistory={searchHistory}
              onClearHistory={clearSearchHistory}
              onDeleteHistoryItem={deleteSearchHistoryItem}
            />
          </div>

          {/* Right Actions */}
          <div
            id="header-icons"
            className="relative flex items-center gap-6 px-8 py-3"
          >
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="!text-white hover:bg-white/10"
            >
              {theme === 'light' ? (
                <MoonIcon className="h-4 w-4 text-white" />
              ) : (
                <SunIcon className="h-4 w-4 text-white" />
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
                <HeartIcon className="h-4 w-4 text-white" />
              </Link>
            </Button>

            {/* Account */}
            <AccountMenu />

            {/* Favorites + Cart */}
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
