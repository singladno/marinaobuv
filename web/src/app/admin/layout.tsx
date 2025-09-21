import { redirect } from 'next/navigation';

import { ClientProviders } from '@/components/ClientProviders';
import AdminSidebarLayout from '@/components/ui/AdminSidebarLayout';
import { PortalSwitcher } from '@/components/ui/PortalSwitcher';
import { getSession } from '@/lib/server/session';

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
        <PortalSwitcher />
      </div>
    </ClientProviders>
  );
}
