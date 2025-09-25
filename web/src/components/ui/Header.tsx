'use client';

import Link from 'next/link';
import {
  HeartIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import MobileMenu from '@/components/ui/MobileMenu';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/components/ui/ThemeProvider';
import { site } from '@/lib/site';
import TopRightActions from '@/components/product/TopRightActions';
import AccountMenu from '@/components/ui/AccountMenu';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      // Default search behavior - redirect to catalog with search params
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.set('search', query);
      }
      window.location.href = `/catalog?${searchParams.toString()}`;
    }
  };

  const handleMenuClick = (item: string) => {
    console.log(`Navigation clicked: ${item}`);
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href={site.links.home} className="hover:opacity-90">
            <Text as="span" className="text-xl font-bold">
              {site.brand}
            </Text>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('catalog')}
            asChild
          >
            <Link href={site.links.catalog}>Каталог</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('orders')}
            asChild
          >
            <Link href={site.links.orders}>Заказы</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('about')}
            asChild
          >
            <Link href={site.links.about}>О нас</Link>
          </Button>
        </nav>

        {/* Search Bar - Centered and Wider */}
        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-md">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* Right Actions */}
        <div
          id="header-icons"
          className="relative ml-auto flex items-center gap-6 px-8 py-3"
        >
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-transparent"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-4 w-4" />
            ) : (
              <SunIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Favorites */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-transparent"
          >
            <Link href="/favorites" aria-label="Избранное">
              <HeartIcon className="h-4 w-4" />
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
  );
}
