'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Text } from '@/components/ui/Text';

import type { CatalogTreeNode as CategoryTreeNode } from '@/types/catalog-tree';

function stripPrefix(p: string) {
  return p.replace(/^obuv\//, '');
}

function isActive(path: string, activePath?: string) {
  const p = stripPrefix(path);
  if (!activePath) return false;
  return activePath === p || activePath.startsWith(p + '/');
}

function buildCatalogUrlFromPath(path: string) {
  const p = stripPrefix(path);
  return `/catalog/${p}`;
}

export function CategoryTreeClient({
  tree,
  activePath,
}: {
  tree: CategoryTreeNode[];
  activePath?: string;
}) {
  const searchParams = useSearchParams();

  return (
    <nav aria-label="Категории" className="text-sm">
      <ul className="space-y-1">
        {tree.map(n => (
          <li key={n.id}>
            <TreeNode
              node={n}
              activePath={activePath}
              searchParams={searchParams}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TreeNode({
  node,
  activePath,
  searchParams,
}: {
  node: CategoryTreeNode;
  activePath?: string;
  searchParams: URLSearchParams;
}) {
  const expanded = isActive(node.path, activePath);
  const isLeaf = node.children.length === 0;
  const catalogUrl = buildCatalogUrlFromPath(node.path);

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
            <Link href={catalogUrl} className="flex-1 text-left">
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
                  {/* If child has further children, render nested TreeNode; otherwise simple link */}
                  {c.children && c.children.length > 0 ? (
                    <TreeNode
                      node={c}
                      activePath={activePath}
                      searchParams={searchParams}
                    />
                  ) : (
                    <Link
                      href={buildCatalogUrlFromPath(c.path)}
                      className={`block rounded px-2 py-1 transition ${
                        isActive(c.path, activePath)
                          ? 'text-primary'
                          : 'hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]'
                      }`}
                    >
                      <Text as="span">{c.name}</Text>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </div>
  );
}

export default CategoryTreeClient;
