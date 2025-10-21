'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingCart, Search, Filter } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  GruzchikViewProvider,
  useGruzchikView,
} from '@/contexts/GruzchikViewContext';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { ViewToggle } from './ViewToggle';
import { GruzchikPortalSwitcherHeader } from '@/components/ui/GruzchikPortalSwitcherHeader';
import { GruzchikFilterModal } from './GruzchikFilterModal';

interface MobileGruzchikLayoutProps {
  children: React.ReactNode;
}

function GruzchikHeader() {
  const pathname = usePathname();
  const { viewMode, setViewMode, searchQuery, setSearchQuery } =
    useGruzchikView();
  const { hasActiveFilters } = useGruzchikFilter();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3">
          {/* Header with Portal Switcher, Search, and Filter */}
          <div className="flex items-center gap-3">
            {/* Portal Switcher - Left Corner */}
            <div className="flex-shrink-0">
              <GruzchikPortalSwitcherHeader />
            </div>

            {/* Search Bar */}
            <div className="relative flex-1">
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

            {/* Filter Button */}
            <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
                className={cn(
                  'h-10 w-10 p-0',
                  hasActiveFilters && 'border-blue-500 bg-blue-50 text-blue-600'
                )}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {hasActiveFilters && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <GruzchikFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
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
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-lg">
          <div className="flex">
            {navigation.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative flex flex-1 flex-col items-center px-1 py-3 transition-all duration-200 ease-in-out',
                    active
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 active:scale-95'
                  )}
                >
                  {/* Active indicator background */}
                  {active && (
                    <div className="absolute inset-x-2 bottom-1 top-1 rounded-lg bg-blue-50" />
                  )}

                  {/* Icon with weight change for active state */}
                  <div className="relative z-10 mb-1">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-all duration-200',
                        active ? 'stroke-2' : 'stroke-1.5'
                      )}
                    />
                  </div>

                  {/* Text with improved typography */}
                  <span
                    className={cn(
                      'relative z-10 text-xs font-medium transition-all duration-200',
                      active ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </GruzchikViewProvider>
  );
}
