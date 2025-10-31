'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdminNavItems } from '@/hooks/useAdminNavItems';
import { ParsingIndicator } from './ParsingIndicator';

type AdminHorizontalNavProps = {
  variant?: 'standalone' | 'inline';
  className?: string;
  showLabels?: boolean;
};

export default function AdminHorizontalNav({
  variant = 'standalone',
  className = '',
  showLabels = true,
}: AdminHorizontalNavProps) {
  const items = useAdminNavItems();
  const pathname = usePathname();

  const content = (
    <div
      className={`no-scrollbar flex w-full gap-2 overflow-x-auto ${variant === 'standalone' ? 'px-3 py-2' : ''} ${className}`}
    >
      {items.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 items-center ${showLabels ? 'gap-2 px-3 py-2' : 'p-2'} rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
            {showLabels && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
            {item.label === 'Парсинг' && (
              <ParsingIndicator
                isActive={Boolean(item.isParsingActive)}
                collapsed={false}
              />
            )}
          </Link>
        );
      })}
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <nav className="border-b border-gray-200 bg-white md:hidden dark:border-gray-700 dark:bg-gray-900">
      {content}
    </nav>
  );
}
