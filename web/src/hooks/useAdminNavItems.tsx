'use client';

import { useParsingStatus } from '@/hooks/useParsingStatus';
import {
  OrdersIcon,
  ParsingIcon,
  ProductsIcon,
  PurchasesIcon,
  UsersIcon,
} from '@/components/ui/AdminSidebarIcons';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isParsingActive?: boolean;
};

export function useAdminNavItems(): AdminNavItem[] {
  const { isParsingActive } = useParsingStatus();

  return [
    { href: '/admin/products', label: 'Товары', icon: <ProductsIcon /> },
    { href: '/admin/orders', label: 'Заказы', icon: <OrdersIcon /> },
    { href: '/admin/users', label: 'Пользователи', icon: <UsersIcon /> },
    {
      href: '/admin/parsing',
      label: 'Парсинг',
      icon: <ParsingIcon />,
      isParsingActive,
    },
    { href: '/admin/purchases', label: 'Закупки', icon: <PurchasesIcon /> },
  ];
}
