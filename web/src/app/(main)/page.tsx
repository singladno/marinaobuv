// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
// import Link from 'next/link';

import { ButtonLink } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { site } from '@/lib/site';

export default function Home() {
  return (
    <section className="section-hero mx-auto max-w-5xl rounded-xl border border-border bg-surface/60 p-10 text-center shadow-sm">
      <Text variant="h1" as="h1" className="mb-3">{site.brand} — Hello World</Text>
      <Text variant="lead" className="mx-auto mb-8 max-w-2xl">
        Минимальная стартовая страница. Скоро здесь появится каталог с обувью и аксессуарами.
      </Text>
      <div className="mb-8 flex items-center justify-center gap-3">
        <ButtonLink href="/api/health" variant="primary">Проверить API</ButtonLink>
        <ButtonLink href="/about" variant="secondary">О нас</ButtonLink>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-border bg-background p-4 text-left">
          <Text variant="h3">Каталог</Text>
          <Text tone="muted">Ассортимент сезонной обуви и аксессуаров.</Text>
        </div>
        <div className="rounded border border-border bg-background p-4 text-left">
          <Text variant="h3">Опт и розница</Text>
          <Text tone="muted">Гибкие условия для партнёров и покупателей.</Text>
        </div>
        <div className="rounded border border-border bg-background p-4 text-left">
          <Text variant="h3">Быстрая доставка</Text>
          <Text tone="muted">Оперативная обработка и логистика по РФ.</Text>
        </div>
      </div>
    </section>
  );
}
