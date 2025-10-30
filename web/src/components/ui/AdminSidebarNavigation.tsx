'use client';

import { AdminSidebarLink } from './AdminSidebarLink';
import { useAdminNavItems } from '@/hooks/useAdminNavItems';

type AdminSidebarNavigationProps = {
  isCollapsed: boolean;
};

export function AdminSidebarNavigation({
  isCollapsed,
}: AdminSidebarNavigationProps) {
  const items = useAdminNavItems();

  return (
    <nav>
      {items.map(item => (
        <AdminSidebarLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          collapsed={isCollapsed}
          isParsingActive={item.isParsingActive}
        />
      ))}
    </nav>
  );
}
