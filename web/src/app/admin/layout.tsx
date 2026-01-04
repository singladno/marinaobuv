import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';

import { ClientProviders } from '@/components/ClientProviders';
import AdminSidebarLayout from '@/components/ui/AdminSidebarLayout';
import { PortalSwitcher } from '@/components/ui/PortalSwitcher';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Allow ADMIN and EXPORT_MANAGER roles
  const allowedRoles = ['ADMIN', 'EXPORT_MANAGER'];
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    redirect('/');
  }

  return (
    <ClientProviders>
      <div className="bg-background text-foreground flex h-screen">
        <AdminSidebarLayout>{children}</AdminSidebarLayout>
        <PortalSwitcher />
      </div>
    </ClientProviders>
  );
}
