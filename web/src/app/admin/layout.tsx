import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/session';
import AdminSidebarLayout from '@/components/ui/AdminSidebarLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
