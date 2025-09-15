import Link from 'next/link';

import { Text } from '@/components/ui/Text';

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  path: string; // obuv/...
  children: CategoryTreeNode[];
};

function stripPrefix(p: string) {
  return p.replace(/^obuv\//, '');
}

function isActive(path: string, activePath?: string) {
  const p = stripPrefix(path);
  if (!activePath) return false;
  return activePath === p || activePath.startsWith(p + '/');
}

export function CategoryTree({
  tree,
  activePath,
}: {
  tree: CategoryTreeNode[];
  activePath?: string;
}) {
  return (
    <nav aria-label="Категории" className="text-sm">
      <ul className="space-y-1">
        {tree.map(n => (
          <li key={n.id}>
            <TreeNode node={n} activePath={activePath} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TreeNode({
  node,
  activePath,
}: {
  node: CategoryTreeNode;
  activePath?: string;
}) {
  const p = stripPrefix(node.path);
  const expanded = isActive(node.path, activePath);
  const isLeaf = node.children.length === 0;

  return (
    <div className="rounded-md">
      <details className="group" open={expanded}>
        <summary className="list-none">
          <div
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 transition ${
              expanded
                ? 'bg-[color-mix(in_oklab,var(--color-primary),transparent_92%)] text-[color-mix(in_oklab,var(--color-primary),#000_20%)]'
                : 'hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]'
            }`}
          >
            <Link href={`/catalog/${p}`} className="flex-1 text-left">
              <Text as="span" className={expanded ? 'font-medium' : ''}>
                {node.name}
              </Text>
            </Link>
            {!isLeaf && (
              <svg
                className={`h-4 w-4 transition-transform group-open:rotate-180`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </summary>
        {!isLeaf && (
          <div className="overflow-hidden">
            <ul className="border-border bg-surface/60 ml-2 mt-1 space-y-1 rounded-md border p-2 backdrop-blur-sm">
              {node.children.map(c => (
                <li key={c.id}>
                  <Link
                    href={`/catalog/${stripPrefix(c.path)}`}
                    className={`block rounded px-2 py-1 transition ${
                      isActive(c.path, activePath)
                        ? 'text-primary'
                        : 'hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]'
                    }`}
                  >
                    <Text as="span">{c.name}</Text>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </div>
  );
}

export default CategoryTree;
