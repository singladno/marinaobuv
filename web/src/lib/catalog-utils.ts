export function normalizeInputPath(path?: string) {
  if (!path) return undefined;
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed.length ? trimmed : undefined;
}

export function dbPathFromInput(path?: string) {
  const normalized = normalizeInputPath(path);
  return normalized ? `obuv/${normalized}` : undefined;
}

export function buildCategoryPath(category: {
  path: string;
  name: string;
}): string {
  return category.path.replace(/^obuv\//, '');
}

export function buildCategoryBreadcrumbs(
  category: { path: string; name: string },
  allCategories: Array<{ id: string; name: string; path: string }>
): Array<{ id: string; name: string; path: string }> {
  const pathParts = buildCategoryPath(category).split('/');
  const breadcrumbs: Array<{ id: string; name: string; path: string }> = [];

  for (let i = 0; i < pathParts.length; i++) {
    const currentPath = pathParts.slice(0, i + 1).join('/');
    const fullPath = `obuv/${currentPath}`;

    const category = allCategories.find(cat => cat.path === fullPath);
    if (category) {
      breadcrumbs.push(category);
    }
  }

  return breadcrumbs;
}
