'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdminNavItems } from '@/hooks/useAdminNavItems';

type AdminBottomNavigationProps = {
  className?: string;
};

export default function AdminBottomNavigation({ className = '' }: AdminBottomNavigationProps) {
  const pathname = usePathname();
  const items = useAdminNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ bottom: '-1px' }}>
      <nav className={`bg-white shadow-2xl ${className}`}>
        <div className="flex h-16 items-center justify-around">
          {items.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center">
                <div className="relative">
                  <span className={`[&>svg]:h-6 [&>svg]:w-6 ${isActive ? 'text-purple-600' : 'text-gray-300'}`}>
                    {item.icon}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


