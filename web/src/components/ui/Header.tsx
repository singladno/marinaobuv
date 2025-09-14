import Link from 'next/link';

import { site } from '@/lib/site';
import { Text } from '@/components/ui/Text';

export default function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href={site.links.home} className="hover:opacity-90">
          <Text as="span" className="text-xl font-semibold tracking-tight">
            {site.brand}
          </Text>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href={site.links.catalog} className="hover:text-primary">
            <Text as="span">Каталог</Text>
          </Link>
          <Link href={site.links.about} className="hover:text-primary">
            <Text as="span">О нас</Text>
          </Link>
        </nav>
      </div>
    </header>
  );
}
