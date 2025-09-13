import Link from 'next/link';

import { site } from '@/lib/site';

export default function Header() {
  return (
    <header className="border-b bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href={site.links.home} className="text-xl font-semibold tracking-tight hover:opacity-90">
          {site.brand}
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href={site.links.catalog} className="hover:text-blue-600 dark:hover:text-blue-400">
            Каталог
          </Link>
          <Link href={site.links.about} className="hover:text-blue-600 dark:hover:text-blue-400">
            О нас
          </Link>
        </nav>
      </div>
    </header>
  );
}
