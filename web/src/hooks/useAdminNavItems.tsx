'use client';

import { useParsingStatus } from '@/hooks/useParsingStatus';
import { useUser } from '@/contexts/NextAuthUserContext';
import {
  CategoriesIcon,
  ExportIcon,
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

export function useAdminNavItems(userRole?: string): AdminNavItem[] {
  const { isParsingActive } = useParsingStatus();
  const { user } = useUser();

  // Use provided role or fallback to user role from context
  const role = userRole || user?.role;

  // For EXPORT_MANAGER, only show Export menu item
  if (role === 'EXPORT_MANAGER') {
    return [{ href: '/admin/exports', label: 'Экспорт', icon: <ExportIcon /> }];
  }

  // For ADMIN, show all menu items
  // If role is not yet loaded, show empty array to prevent flickering
  if (!role) {
    return [];
  }

  return [
    { href: '/admin/products', label: 'Товары', icon: <ProductsIcon /> },
    { href: '/admin/categories', label: 'Категории', icon: <CategoriesIcon /> },
    { href: '/admin/orders', label: 'Заказы', icon: <OrdersIcon /> },
    { href: '/admin/users', label: 'Пользователи', icon: <UsersIcon /> },
    {
      href: '/admin/parsing',
      label: 'Парсинг',
      icon: <ParsingIcon />,
      isParsingActive,
    },
    { href: '/admin/purchases', label: 'Закупки', icon: <PurchasesIcon /> },
    { href: '/admin/exports', label: 'Экспорт', icon: <ExportIcon /> },
  ];
}
