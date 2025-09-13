import type { Metadata } from 'next';

import { site } from './site';

type BuildOpts = {
  title?: string;
  description?: string;
  canonical?: string;
  images?: string[];
};

const defaultTitle = `${site.brand} — обувь и аксессуары`;

export function buildMetadata(opts: BuildOpts = {}): Metadata {
  const title = opts.title ?? defaultTitle;
  const description =
    opts.description ??
    `${site.brand} — современный магазин обуви и аксессуаров. Каталог, акции, быстрая доставка по России.`;

  const images = (opts.images ?? ['/og-default.png']).map((src) => ({ url: src }));

  return {
    title: {
      default: defaultTitle,
      template: `%s — ${site.brand}`,
    },
    description,
    metadataBase: new URL(site.url),
    alternates: {
      canonical: opts.canonical ?? '/',
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: opts.canonical ?? '/',
      siteName: site.brand,
      images,
      type: 'website',
      locale: 'ru_RU',
    },
  } satisfies Metadata;
}

export const defaultMetadata = buildMetadata();
