'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingCart, Search } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  GruzchikViewProvider,
  useGruzchikView,
} from '@/contexts/GruzchikViewContext';
import { ViewToggle } from './ViewToggle';
import { GruzchikPortalSwitcherHeader } from '@/components/ui/GruzchikPortalSwitcherHeader';

interface MobileGruzchikLayoutProps {
  children: React.ReactNode;
}

function GruzchikHeader() {
  const pathname = usePathname();
  const { viewMode, setViewMode, searchQuery, setSearchQuery } =
    useGruzchikView();

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="px-4 py-3">
        {/* Header with Title, Search, and Portal Switcher */}
        <div className="flex items-center justify-between gap-3">
          {/* Title Section */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-semibold text-gray-900">Грузчик</h1>
            <p className="text-xs text-gray-500">
              {pathname.includes('availability') ? 'Наличие' : 'Закупка'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Поиск по товарам, коду, клиенту..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          {/* Portal Switcher - Top Right */}
          <div className="flex-shrink-0">
            <GruzchikPortalSwitcherHeader />
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="mt-3">
          <ViewToggle mode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>
    </div>
  );
}

export function MobileGruzchikLayout({ children }: MobileGruzchikLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Наличие',
      href: '/gruzchik/availability',
      icon: Package,
      description: 'Проверка наличия товаров',
    },
    {
      name: 'Закупка',
      href: '/gruzchik/purchase',
      icon: ShoppingCart,
      description: 'Закупка товаров',
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <GruzchikViewProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header with Search */}
        <GruzchikHeader />

        {/* Main Content */}
        <main className="pb-20">{children}</main>

        {/* Bottom Navigation - visible on all breakpoints */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
          <div className="flex">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-1 flex-col items-center px-1 py-2',
                    isActive(item.href) ? 'text-blue-600' : 'text-gray-500'
                  )}
                >
                  <Icon className="mb-1 h-5 w-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </GruzchikViewProvider>
  );
}
