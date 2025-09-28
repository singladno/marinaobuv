import { redirect } from 'next/navigation';

import { ClientProviders } from '@/components/ClientProviders';
import { GruzchikPortalSwitcher } from '@/components/ui/GruzchikPortalSwitcher';
import GruzchikSidebarLayout from '@/components/ui/GruzchikSidebarLayout';
import { getSession } from '@/lib/server/session';

export default async function GruzchikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'GRUZCHIK') redirect('/');

  return (
    <ClientProviders>
      <div className="bg-background text-foreground flex h-screen">
        <GruzchikSidebarLayout>{children}</GruzchikSidebarLayout>
        <GruzchikPortalSwitcher />
      </div>
    </ClientProviders>
  );
}
