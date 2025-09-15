import Link from 'next/link';

import { Text } from '@/components/ui/Text';
import { site } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border/80 bg-surface/80 supports-[backdrop-filter]:bg-surface/70 border-t backdrop-blur">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-6 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Text tone="muted">
          © {year} {site.brand}
        </Text>
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
