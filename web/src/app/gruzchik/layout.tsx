import { redirect } from 'next/navigation';

import { ClientProviders } from '@/components/ClientProviders';
import { MobileGruzchikLayout } from '@/components/features/gruzchik/MobileGruzchikLayout';
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
      <MobileGruzchikLayout>{children}</MobileGruzchikLayout>
    </ClientProviders>
  );
}
