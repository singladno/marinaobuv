// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
import Link from 'next/link';

import { site } from '@/lib/site';

export default function Home() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <h1 className="mb-3 text-4xl font-bold sm:text-5xl">{site.brand} — Hello World</h1>
      <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
        Минимальная стартовая страница. Скоро здесь появится каталог с обувью и аксессуарами.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/api/health"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Проверить API
        </Link>
        <Link
          href="/about"
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          О нас
        </Link>
      </div>
    </section>
  );
}
