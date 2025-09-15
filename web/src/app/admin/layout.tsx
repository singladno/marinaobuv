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
      <aside className="bg-surface/70 w-60 shrink-0 border-r p-4 backdrop-blur-sm">
        <nav className="space-y-1 text-sm">
          <Link
            className="block rounded-md px-3 py-2 transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]"
            href="/admin"
          >
            Главная
          </Link>
          <Link
            className="block rounded-md px-3 py-2 transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]"
            href="/admin/drafts"
          >
            Черновики
          </Link>
          <Link
            className="block rounded-md px-3 py-2 transition hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]"
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
