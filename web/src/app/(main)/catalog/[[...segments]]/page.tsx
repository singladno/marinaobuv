import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CategoryTree from '@/components/catalog/CategoryTree';
import FilterBar from '@/components/catalog/FilterBar';
import ProductCard from '@/components/product/ProductCard';
import { Card } from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { Text } from '@/components/ui/Text';
import {
  getCategoryByPath,
  getCategoryTree,
  getPriceBoundsForPath,
  listProductsByCategoryPath,
} from '@/lib/catalog';
import { parseFilters } from '@/lib/filters';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { segments?: string[] };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const path = (params.segments ?? []).join('/');
  if (!path)
    return buildMetadata({ title: 'Каталог обуви', canonical: `/catalog` });
  const cat = await getCategoryByPath(path);
  if (!cat)
    return buildMetadata({ title: 'Каталог обуви', canonical: `/catalog` });
  let title = cat.name;
  if (cat.parent) title = `${cat.parent.name} — ${cat.name}`;
  return buildMetadata({ title, canonical: `/catalog/${path}` });
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const segments = params.segments ?? [];
  const path = segments.length ? segments.join('/') : undefined;

  // parse filters from search params
  const sp = new URLSearchParams();
  const awaitedSearchParams = await searchParams;
  for (const [key, value] of Object.entries(awaitedSearchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) if (v != null) sp.append(key, v);
    } else if (value != null) {
      sp.set(key, value);
    }
  }
  const filters = parseFilters(sp);

  const [tree, category, list, bounds] = await Promise.all([
    getCategoryTree(),
    path ? getCategoryByPath(path) : Promise.resolve(null),
    listProductsByCategoryPath({ path, filters }),
    getPriceBoundsForPath(path),
  ]);

  if (path && !category) notFound();

  const { items, total, page, pageSize } = list;

  const heading = category?.parent
    ? `${category.parent.name} — ${category.name}`
    : (category?.name ?? 'Каталог обуви');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <aside className="md:col-span-3 lg:col-span-3">
        <Card className="p-3">
          <Text variant="overline" className="mb-2">
            Категории
          </Text>
          <CategoryTree tree={tree} activePath={path} />
        </Card>
      </aside>
      <section className="md:col-span-9 lg:col-span-9">
        <Text variant="h2" as="h1" className="mb-4">
          {heading}
        </Text>

        {/* Filters bar */}
        <div className="hidden md:block">
          <FilterBar path={path} filters={filters} bounds={bounds} />
        </div>

        <div className="text-muted mb-3 text-sm">Найдено: {total}</div>

        {items.length === 0 ? (
          <div className="border-border bg-surface rounded border p-6 text-center">
            <Text tone="muted">Нет товаров в этом разделе</Text>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map(p => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                pricePair={p.pricePair}
                currency={p.currency}
                imageUrl={p.primaryImageUrl}
              />
            ))}
          </div>
        )}

        <Pagination
          basePath={`/catalog${path ? '/' + path : ''}`}
          total={total}
          page={page}
          pageSize={pageSize}
          filters={filters}
        />
      </section>
    </div>
  );
}
