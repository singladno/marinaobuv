export function normalizeInputPath(path?: string) {
  if (!path) return undefined;
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed.length ? trimmed : undefined;
}

export function dbPathFromInput(path?: string) {
  // Return path as-is, no hardcoded prefix - categories are stored with their full path
  return normalizeInputPath(path);
}

export function buildCategoryPath(category: {
  path: string;
  name: string;
}): string {
  // Return path as-is, no prefix removal needed
  return category.path;
}

export function buildCategoryBreadcrumbs(
  category: { path: string; name: string },
  allCategories: Array<{ id: string; name: string; path: string }>
): Array<{ id: string; name: string; path: string }> {
  const pathParts = category.path.split('/');
  const breadcrumbs: Array<{ id: string; name: string; path: string }> = [];

  for (let i = 0; i < pathParts.length; i++) {
    const currentPath = pathParts.slice(0, i + 1).join('/');

    const category = allCategories.find(cat => cat.path === currentPath);
    if (category) {
      breadcrumbs.push(category);
    }
  }

  return breadcrumbs;
}
