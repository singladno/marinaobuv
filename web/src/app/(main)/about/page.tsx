import type { Metadata } from 'next';

import { buildMetadata } from '@/lib/seo';

export const generateMetadata = async (): Promise<Metadata> =>
  buildMetadata({
    title: 'О нас',
    canonical: '/about',
    description:
      'Узнайте больше о MarinaObuv: миссия, ценности и планы развития магазина обуви и аксессуаров.',
  });

export default function AboutPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">О нас</h1>
      <p className="text-gray-700 dark:text-gray-300">
        Здесь будет информация о компании MarinaObuv. Мы готовим каталог,
        доставку и сервис. Загляните позже!
      </p>
    </section>
  );
}
