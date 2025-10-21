'use client';

import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import { useTheme } from '@/components/ui/ThemeProvider';
import { site } from '@/lib/site';

export default function MobileMenu() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (item: string) => {
    console.log(`Navigation clicked: ${item}`);
    setIsOpen(false);
  };

  const menuItems = [
    { name: 'Каталог', href: site.links.catalog, icon: null },
    { name: 'Заказы', href: site.links.orders, icon: null },
    { name: 'О нас', href: site.links.about, icon: null },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Bars3Icon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-semibold">Меню</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 py-6">
            {menuItems.map(item => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMenuClick(item.name.toLowerCase())}
                asChild
              >
                <Link href={item.href}>{item.name}</Link>
              </Button>
            ))}
          </nav>

          {/* Actions */}
          <div className="border-border border-t pt-4">
            <div className="space-y-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <MoonIcon className="mr-2 h-4 w-4" />
                ) : (
                  <SunIcon className="mr-2 h-4 w-4" />
                )}
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </Button>

              {/* Account */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMenuClick('account')}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Аккаунт
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
