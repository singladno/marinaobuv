'use client';

import {
  ProductsIcon,
  OrdersIcon,
  UsersIcon,
  ParsingIcon,
  DraftsIcon,
} from './AdminSidebarIcons';
import { AdminSidebarLink } from './AdminSidebarLink';

type AdminSidebarNavigationProps = {
  isCollapsed: boolean;
};

export function AdminSidebarNavigation({
  isCollapsed,
}: AdminSidebarNavigationProps) {
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
      />
    </nav>
  );
}
