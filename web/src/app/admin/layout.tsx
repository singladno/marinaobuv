import { redirect } from 'next/navigation';

import { getSession } from '@/lib/server/session';
import AdminSidebarLayout from '@/components/ui/AdminSidebarLayout';
import { ClientProviders } from '@/components/ClientProviders';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <ClientProviders>
      <div className="bg-background text-foreground flex h-screen">
        <AdminSidebarLayout>{children}</AdminSidebarLayout>
      </div>
    </ClientProviders>
  );
}
