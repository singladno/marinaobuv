import Link from 'next/link';

import { Text } from '@/components/ui/Text';
import { site } from '@/lib/site';
import { getSession } from '@/lib/server/session';

export default async function Header() {
  const session = await getSession();
  const isAuthed = !!session;
  const isAdmin = session?.role === 'ADMIN';

  return (
    <header className="border-border/80 bg-surface/80 supports-[backdrop-filter]:bg-surface/70 border-b backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
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
          {!isAuthed && (
            <Link
              href="/login"
              className="text-primary rounded-md px-3 py-1.5 hover:bg-[color-mix(in_oklab,var(--color-primary),transparent_85%)]"
            >
              <Text as="span" className="font-medium">
                Войти
              </Text>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md bg-[color-mix(in_oklab,var(--color-primary),transparent_85%)] px-3 py-1.5 text-[color-mix(in_oklab,var(--color-primary),#000_20%)] hover:bg-[color-mix(in_oklab,var(--color-primary),transparent_78%)]"
            >
              <Text as="span" className="font-medium">
                Админ
              </Text>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
