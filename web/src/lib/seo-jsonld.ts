type Crumb = { name: string; url: string };

export function buildBreadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function buildItemListJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((i, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: i.url,
      name: i.name,
    })),
  };
}
