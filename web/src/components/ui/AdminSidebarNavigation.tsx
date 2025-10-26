'use client';

import { useParsingStatus } from '@/hooks/useParsingStatus';

import {
  ProductsIcon,
  OrdersIcon,
  UsersIcon,
  ParsingIcon,
  DraftsIcon,
  PurchasesIcon,
} from './AdminSidebarIcons';
import { AdminSidebarLink } from './AdminSidebarLink';

type AdminSidebarNavigationProps = {
  isCollapsed: boolean;
};

export function AdminSidebarNavigation({
  isCollapsed,
}: AdminSidebarNavigationProps) {
  const { isParsingActive } = useParsingStatus();

  return (
    <nav>
      <AdminSidebarLink
        href="/admin/products"
        label="Товары"
        icon={<ProductsIcon />}
        collapsed={isCollapsed}
      />

      <AdminSidebarLink
        href="/admin/orders"
        label="Заказы"
        icon={<OrdersIcon />}
        collapsed={isCollapsed}
      />

      <AdminSidebarLink
        href="/admin/users"
        label="Пользователи"
        icon={<UsersIcon />}
        collapsed={isCollapsed}
      />

      <AdminSidebarLink
        href="/admin/parsing"
        label="Парсинг"
        icon={<ParsingIcon />}
        collapsed={isCollapsed}
        isParsingActive={isParsingActive}
      />

      <AdminSidebarLink
        href="/admin/purchases"
        label="Закупки"
        icon={<PurchasesIcon />}
        collapsed={isCollapsed}
      />
    </nav>
  );
}
