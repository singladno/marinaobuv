import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';

import { ClientProviders } from '@/components/ClientProviders';
import { MobileGruzchikLayout } from '@/components/features/gruzchik/MobileGruzchikLayout';
import { ProviderSortingProvider } from '@/contexts/ProviderSortingContext';
import { authOptions } from '@/lib/auth';

export default async function GruzchikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'GRUZCHIK') redirect('/');

  return (
    <ClientProviders>
      <ProviderSortingProvider>
        <MobileGruzchikLayout>{children}</MobileGruzchikLayout>
      </ProviderSortingProvider>
    </ClientProviders>
  );
}
