'use client';

import {
  HomeIcon,
  DraftsIcon,
  ProductsIcon,
  OrdersIcon,
  UsersIcon,
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
        href="/admin"
        label="Главная"
        icon={<HomeIcon />}
        collapsed={isCollapsed}
      />

      <AdminSidebarLink
        href="/admin/drafts"
        label="Черновики"
        icon={<DraftsIcon />}
        collapsed={isCollapsed}
      />

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
    </nav>
  );
}
