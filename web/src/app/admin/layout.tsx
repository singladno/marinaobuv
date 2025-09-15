import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <div className="flex min-h-[60vh] gap-6">
      <aside className="w-56 shrink-0 border-r p-4">
        <nav className="space-y-2 text-sm">
          <Link
            className="hover:bg-muted block rounded px-2 py-1"
            href="/admin"
          >
            Главная
          </Link>
          <Link
            className="hover:bg-muted block rounded px-2 py-1"
            href="/admin/drafts"
          >
            Черновики
          </Link>
          <Link
            className="hover:bg-muted block rounded px-2 py-1"
            href="/admin/products"
          >
            Товары
          </Link>
        </nav>
      </aside>
      <section className="flex-1 p-2 sm:p-4">{children}</section>
    </div>
  );
}
