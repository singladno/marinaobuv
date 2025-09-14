import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { rub, genderRu, seasonRu } from '@/lib/format';
import { productAlt } from '@/lib/alt';
import { Text } from '@/components/ui/Text';
import { buildMetadata } from '@/lib/seo';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { name: true } });
  if (!product) return buildMetadata({ title: 'Товар не найден', canonical: `/product/${params.slug}` });
  return buildMetadata({ title: product.name, canonical: `/product/${params.slug}` });
}

export default async function ProductPage({ params }: PageProps) {
  const p = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }] },
      sizes: { orderBy: { size: 'asc' } },
      category: { select: { path: true, name: true, parent: { select: { name: true, slug: true, path: true } } } },
    },
  });

  if (!p) notFound();

  const mainImage = p.images[0]?.url ?? null;
  const gallery = p.images.map((i) => i.url);
  const altBase = productAlt({ name: p.name, article: p.article });
  const sizes = [...p.sizes].sort((a, b) => (Number(a.size) || 0) - (Number(b.size) || 0));

  const pathNoPrefix = p.category.path.replace(/^obuv\//, '');
  const [seasonSlug, typeSlug] = pathNoPrefix.split('/');

  const breadcrumbs = [
    { href: '/', label: 'Главная' },
    { href: '/catalog', label: 'Каталог' },
  ];
  if (seasonSlug) breadcrumbs.push({ href: `/catalog/${seasonSlug}`, label: seasonRuSlug(seasonSlug) });
  if (typeSlug) breadcrumbs.push({ href: `/catalog/${seasonSlug}/${typeSlug}`, label: p.category.name });
  breadcrumbs.push({ href: `/product/${p.slug}`, label: p.name });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {mainImage && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
            <Image src={mainImage} alt={altBase} fill className="object-cover" />
          </div>
        )}
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {gallery.slice(0, 6).map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                <Image src={url} alt={`${altBase} — фото ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-4">
        <nav className="mb-3 text-sm text-muted">
          {breadcrumbs.map((b, i) => (
            <span key={b.href}>
              {i > 0 && <span className="mx-1">/</span>}
              <Link href={b.href} className="hover:underline">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
        <Text variant="h2" as="h1" className="mb-2">{p.name}</Text>
        {p.article && <Text variant="caption" className="mb-2">Артикул: {p.article}</Text>}

        <div className="mb-4">
          <div className="text-2xl font-bold">{rub(p.pricePair)}</div>
          {p.packPairs && p.priceBox && (
            <div className="text-sm text-gray-600">{p.packPairs} пар в коробке · {rub(p.priceBox)}</div>
          )}
        </div>

        <dl className="mb-4 space-y-1 text-sm text-muted">
          {p.material && (
            <div>
              <dt className="inline text-gray-500">Материал: </dt>
              <dd className="inline">{p.material}</dd>
            </div>
          )}
          {p.gender && (
            <div>
              <dt className="inline text-gray-500">Пол: </dt>
              <dd className="inline">{genderRu[p.gender]}</dd>
            </div>
          )}
          {p.season && (
            <div>
              <dt className="inline text-gray-500">Сезон: </dt>
              <dd className="inline">{seasonRu[p.season]}</dd>
            </div>
          )}
        </dl>

        {sizes.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium">Размеры в коробке</div>
            <div className="grid grid-cols-6 gap-2">
              {sizes.map((s) => (
                <div key={s.id} className="rounded border px-2 py-1 text-center text-sm dark:border-gray-700">
                  {s.size}
                  {s.perBox ? <span className="text-gray-500"> ×{s.perBox}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {p.description && <Text className="whitespace-pre-line">{p.description}</Text>}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: p.name,
            image: gallery,
            sku: p.article ?? undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'RUB',
              price: (p.pricePair / 100).toFixed(0),
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />
    </div>
  );
}

function seasonRuSlug(slug?: string) {
  switch (slug) {
    case 'vesna':
      return 'Весна';
    case 'leto':
      return 'Лето';
    case 'osen':
      return 'Осень';
    case 'zima':
      return 'Зима';
    default:
      return slug ?? '';
  }
}
