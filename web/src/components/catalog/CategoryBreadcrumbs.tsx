'use client';

import Link from 'next/link';

import { Text } from '@/components/ui/Text';

interface BreadcrumbItem {
  name: string;
  path: string;
  href: string;
}

interface CategoryBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function CategoryBreadcrumbs({
  items,
  className = '',
}: CategoryBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Навигация по категориям"
      className={`text-sm ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            {index === items.length - 1 ? (
              <Text className="font-medium text-gray-600" as="span">
                {item.name}
              </Text>
            ) : (
              <Link
                href={item.href}
                className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
              >
                <Text as="span">{item.name}</Text>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default CategoryBreadcrumbs;
