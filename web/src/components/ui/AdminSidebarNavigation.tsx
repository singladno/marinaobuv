'use client';

import { AdminSidebarLink } from './AdminSidebarLink';
import { useAdminNavItems } from '@/hooks/useAdminNavItems';

type AdminSidebarNavigationProps = {
  isCollapsed: boolean;
  userRole?: string;
};

export function AdminSidebarNavigation({
  isCollapsed,
  userRole,
}: AdminSidebarNavigationProps) {
  const items = useAdminNavItems(userRole);

  // Don't render navigation until we know the role
  if (!userRole && items.length === 0) {
    return null;
  }

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
