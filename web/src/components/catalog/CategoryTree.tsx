import { Text } from '@/components/ui/Text';
import Link from 'next/link';

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

export function CategoryTree({ tree, activePath }: { tree: CategoryTreeNode[]; activePath?: string }) {
  return (
    <nav aria-label="Категории" className="text-sm">
      <ul className="space-y-2">
        {tree.map((n) => (
          <li key={n.id}>
            <TreeNode node={n} activePath={activePath} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TreeNode({ node, activePath }: { node: CategoryTreeNode; activePath?: string }) {
  const p = stripPrefix(node.path);
  const expanded = isActive(node.path, activePath);
  const isLeaf = node.children.length === 0;

  return (
    <div>
      <Link href={`/catalog/${p}`} className={`${expanded ? 'text-primary' : 'hover:underline'}`}>
        <Text as="span" className={expanded ? 'font-semibold' : ''}>
          {node.name}
        </Text>
      </Link>
      {expanded && !isLeaf && (
        <ul className="mt-2 ml-4 space-y-1 border-l pl-3">
          {node.children.map((c) => (
            <li key={c.id}>
              <Link
                href={`/catalog/${stripPrefix(c.path)}`}
                className={`${isActive(c.path, activePath) ? 'text-primary' : 'hover:underline'}`}
              >
                <Text as="span">{c.name}</Text>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoryTree;
