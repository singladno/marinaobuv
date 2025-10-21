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
    .filter(category => category !== null) as CategoryNode[];
}

export function getIndentationClass(level: number): string {
  // Support up to 10 levels of nesting with proper Tailwind classes
  const indentationClasses = [
    'pl-1', // level 0
    'pl-2', // level 1
    'pl-3', // level 2
    'pl-4', // level 3
    'pl-5', // level 4
    'pl-6', // level 5
    'pl-7', // level 6
    'pl-8', // level 7
    'pl-9', // level 8
    'pl-10', // level 9
    'pl-11', // level 10+
  ];

  return indentationClasses[Math.min(level, indentationClasses.length - 1)];
}

export type FlatCategoryOption = {
  id: string;
  label: string;
  level: number;
};

// Flattens the nested category tree into a simple list for checkable UI controls
export function flattenCategoryTree(
  categories: CategoryNode[],
  level = 0
): FlatCategoryOption[] {
  const result: FlatCategoryOption[] = [];
  for (const node of categories) {
    result.push({ id: node.id, label: node.name, level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, level + 1));
    }
  }
  return result;
}
