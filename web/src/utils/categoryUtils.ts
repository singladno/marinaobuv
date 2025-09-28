import type { CategoryNode } from '@/components/ui/CategorySelector';

export function findCategoryById(
  categories: CategoryNode[],
  id: string
): CategoryNode | null {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function filterCategoriesBySearch(
  categories: CategoryNode[],
  searchTerm: string
): CategoryNode[] {
  return categories
    .map(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm);
      const filteredChildren = category.children
        ? filterCategoriesBySearch(category.children, searchTerm)
        : [];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren,
        };
      }
      return null;
    })
    .filter((category): category is CategoryNode => category !== null);
}

export function getIndentationClass(level: number): string {
  // Support up to 10 levels of nesting with proper Tailwind classes
  const indentationClasses = [
    'pl-3', // level 0
    'pl-6', // level 1
    'pl-9', // level 2
    'pl-12', // level 3
    'pl-16', // level 4
    'pl-20', // level 5
    'pl-24', // level 6
    'pl-28', // level 7
    'pl-32', // level 8
    'pl-36', // level 9
    'pl-40', // level 10+
  ];

  return indentationClasses[Math.min(level, indentationClasses.length - 1)];
}
