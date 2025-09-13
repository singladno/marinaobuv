import Link from 'next/link';

import { site } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
      <div className="container mx-auto flex flex-col gap-3 px-4 sm:px-6 lg:px-8 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-gray-600 dark:text-gray-400">© {year} {site.brand}</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Политика
          </Link>
          <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
}
