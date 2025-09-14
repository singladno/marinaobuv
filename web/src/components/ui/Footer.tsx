import Link from 'next/link';

import { site } from '@/lib/site';
import { Text } from '@/components/ui/Text';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border bg-surface/80 backdrop-blur">
      <div className="container mx-auto flex flex-col gap-3 px-4 sm:px-6 lg:px-8 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <Text tone="muted">© {year} {site.brand}</Text>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-primary">
            <Text as="span">Политика</Text>
          </Link>
          <Link href="#" className="hover:text-primary">
            <Text as="span">Контакты</Text>
          </Link>
        </div>
      </div>
    </footer>
  );
}
